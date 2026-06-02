package com.poly.dindor.service;

import com.poly.dindor.dto.response.ArticleDashboardItem;
import com.poly.dindor.dto.response.ArticlePredictionSummary;
import com.poly.dindor.dto.response.PredictionResponse;
import com.poly.dindor.entity.Article;
import com.poly.dindor.repository.ArticleRepository;
import com.poly.dindor.repository.BonLivraisonRepository;
import com.poly.dindor.repository.FactureAchatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PredictionService {

    @Value("${ai.prediction.url:http://localhost:8001}")
    private String aiServiceUrl;

    private final FactureAchatRepository factureAchatRepository;
    private final ArticleRepository articleRepository;
    private final BonLivraisonRepository bonLivraisonRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public List<ArticlePredictionSummary> getArticlesWithHistory() {
        // Primary source: articles actually SOLD (BL ventes)
        List<Object[]> salesRows = bonLivraisonRepository.findDistinctDesignationsWithSalesStats();
        List<ArticlePredictionSummary> result = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();

        for (Object[] row : salesRows) {
            String designation = (String) row[0];
            if (designation == null || designation.isBlank()) continue;
            long nbVentes  = ((Number) row[1]).longValue();
            double qteVendue = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            // Use last purchase price as reference price
            double prixRef = 0.0;
            List<Object[]> ph = factureAchatRepository.findPriceHistoryByDesignation(designation);
            if (!ph.isEmpty()) {
                BigDecimal lp = (BigDecimal) ph.get(ph.size() - 1)[2];
                if (lp != null) prixRef = lp.doubleValue();
            }
            result.add(new ArticlePredictionSummary(designation, nbVentes, prixRef, qteVendue));
            seen.add(designation.toLowerCase());
        }

        // Secondary: add articles from purchases not yet in sales list
        List<Object[]> purchaseRows = factureAchatRepository.findDistinctDesignationsWithStats();
        for (Object[] row : purchaseRows) {
            String designation = (String) row[0];
            if (designation == null || designation.isBlank()) continue;
            if (seen.contains(designation.toLowerCase())) continue;
            long nbAchats = ((Number) row[1]).longValue();
            double prixMoyen = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            result.add(new ArticlePredictionSummary(designation, nbAchats, prixMoyen, 0.0));
        }
        return result;
    }

    /**
     * Lance la prédiction complète pour un article :
     * 1. Historique des prix d'achat (Prophet)
     * 2. Stock actuel + stock minimum
     * 3. Commandes clients en attente (demande réelle)
     * 4. Historique des ventes (90j) pour la demande hebdomadaire
     */
    public PredictionResponse predict(String designation) {
        // 1. Historique des prix d'achat
        List<Object[]> priceRows = factureAchatRepository.findPriceHistoryByDesignation(designation);
        List<Map<String, Object>> history = buildPriceHistory(priceRows);
        if (history.isEmpty()) {
            throw new RuntimeException(
                "Aucun historique d'achat trouvé pour « " + designation + " ». " +
                "Enregistrez au moins une facture d'achat pour cet article avant de lancer la prédiction.");
        }

        // 2. Stock actuel et stock minimum
        List<Article> articles = articleRepository.findByDesignationContainingIgnoreCase(designation);
        double stockActuel = 0.0;
        double stockMinimum = 0.0;
        if (!articles.isEmpty()) {
            Article art = articles.get(0);
            stockActuel = art.getStock1() != null ? art.getStock1().doubleValue() : 0.0;
            stockMinimum = art.getStockMinimum() != null ? art.getStockMinimum().doubleValue() : 0.0;
        }

        List<Map<String, Object>> commandesEnAttente = new ArrayList<>();
        double quantiteCommandee = 0.0;

        // 4. Historique des ventes (90 derniers jours)
        LocalDate depuis90j = LocalDate.now().minusDays(90);
        List<Object[]> salesRows = bonLivraisonRepository.findSalesHistoryByDesignation(designation, depuis90j);
        List<Map<String, Object>> historiqueVentes = buildSalesHistory(salesRows);

        // Calcul demande hebdomadaire réelle
        double totalQteVendue = salesRows.stream()
                .mapToDouble(r -> r[2] != null ? ((Number) r[2]).doubleValue() : 0.0)
                .sum();
        double demandeHebdoMoyenne = totalQteVendue / 13.0;

        log.info("Prediction '{}' | achats={} points | stock={} | commandes={} qte | ventes={} lignes",
                designation, history.size(), stockActuel, quantiteCommandee, historiqueVentes.size());

        // 5. Construire le payload complet pour Python
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("article", designation);
        payload.put("history", history);
        payload.put("horizons", List.of(7, 15, 30));
        payload.put("stock_actuel", stockActuel);
        payload.put("stock_minimum", stockMinimum);
        payload.put("commandes_en_attente", commandesEnAttente);
        payload.put("historique_ventes", historiqueVentes);
        payload.put("demande_hebdo_moyenne", demandeHebdoMoyenne);

        // 6. Appeler le service FastAPI
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<PredictionResponse> response = restTemplate.exchange(
                    aiServiceUrl + "/predict",
                    HttpMethod.POST,
                    entity,
                    PredictionResponse.class
            );
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            throw new RuntimeException("Reponse inattendue du service IA : " + response.getStatusCode());
        } catch (ResourceAccessException e) {
            log.error("Service IA inaccessible ({}). Verifiez que dindor-ai/start.bat est lance.", aiServiceUrl);
            throw new RuntimeException(
                "Le service d'intelligence artificielle est actuellement indisponible. " +
                "Veuillez demarrer le service Python (dindor-ai/start.bat) et reessayer.");
        } catch (Exception e) {
            log.error("Erreur lors de l'appel au service IA : {}", e.getMessage(), e);
            throw new RuntimeException("Erreur de communication avec le service IA : " + e.getMessage());
        }
    }

    // ── Tableau de bord : tous les articles avec historique, triés par urgence ─

    public List<ArticleDashboardItem> getTableauDeBord() {
        // Primary: articles sold in BL
        List<Object[]> salesStats = bonLivraisonRepository.findDistinctDesignationsWithSalesStats();
        List<ArticleDashboardItem> result = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();

        for (Object[] row : salesStats) {
            String designation = (String) row[0];
            if (designation == null || designation.isBlank()) continue;

            long   nbVentes    = ((Number) row[1]).longValue();
            double qteVendue   = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;

            // Sales history (90 days) for weekly demand
            LocalDate depuis90j = LocalDate.now().minusDays(90);
            List<Object[]> salesHistory = bonLivraisonRepository.findSalesHistoryByDesignation(designation, depuis90j);
            double totalQte90j = salesHistory.stream()
                    .mapToDouble(r -> r[2] != null ? ((Number) r[2]).doubleValue() : 0.0)
                    .sum();
            double demandeHebdo = totalQte90j / 13.0; // 90j ≈ 13 semaines

            // Purchase price history for price trend
            List<Object[]> priceHistory = factureAchatRepository.findPriceHistoryByDesignation(designation);
            double prixMoyen  = 0.0;
            double prixDernier= 0.0;
            double prixVariationPct = 0.0;
            String tendance = "stable";
            if (!priceHistory.isEmpty()) {
                double sum = 0; int cnt = 0;
                for (Object[] r : priceHistory) {
                    BigDecimal p = (BigDecimal) r[2];
                    if (p != null) { sum += p.doubleValue(); cnt++; }
                }
                prixMoyen = cnt > 0 ? sum / cnt : 0;
                BigDecimal lp = (BigDecimal) priceHistory.get(priceHistory.size() - 1)[2];
                if (lp != null) {
                    prixDernier = lp.doubleValue();
                    if (prixMoyen > 0) {
                        prixVariationPct = ((prixDernier - prixMoyen) / prixMoyen) * 100;
                        if (prixVariationPct > 5)  tendance = "hausse";
                        else if (prixVariationPct < -5) tendance = "baisse";
                    }
                }
            }

            // Stock
            List<Article> articles = articleRepository.findByDesignationContainingIgnoreCase(designation);
            double stockActuel  = 0.0;
            double stockMinimum = 0.0;
            if (!articles.isEmpty()) {
                Article art = articles.get(0);
                stockActuel  = art.getStock1()      != null ? art.getStock1().doubleValue()      : 0.0;
                stockMinimum = art.getStockMinimum() != null ? art.getStockMinimum().doubleValue() : 0.0;
            }

            // Urgence : basée sur stock vs demande réelle
            boolean stockCritique = stockActuel < demandeHebdo || (stockMinimum > 0 && stockActuel <= stockMinimum);
            boolean stockBas      = !stockCritique && (stockActuel < demandeHebdo * 2 || (stockMinimum > 0 && stockActuel <= stockMinimum * 1.5));
            String urgence = stockCritique ? "CRITIQUE" : (stockBas || "hausse".equals(tendance)) ? "ALERTE" : "OK";

            result.add(new ArticleDashboardItem(
                    designation, nbVentes, prixMoyen, prixDernier, prixVariationPct,
                    stockActuel, stockMinimum, stockCritique, stockBas, urgence, tendance,
                    qteVendue, demandeHebdo, nbVentes));
            seen.add(designation.toLowerCase());
        }

        // Add articles from purchases not yet sold (they still need stock monitoring)
        List<Object[]> purchaseStats = factureAchatRepository.findDistinctDesignationsWithStats();
        for (Object[] row : purchaseStats) {
            String designation = (String) row[0];
            if (designation == null || designation.isBlank()) continue;
            if (seen.contains(designation.toLowerCase())) continue;
            long nbAchats = ((Number) row[1]).longValue();
            double prixMoyen = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;

            List<Article> articles = articleRepository.findByDesignationContainingIgnoreCase(designation);
            double stockActuel = 0.0, stockMinimum = 0.0;
            if (!articles.isEmpty()) {
                Article art = articles.get(0);
                stockActuel  = art.getStock1()       != null ? art.getStock1().doubleValue()       : 0.0;
                stockMinimum = art.getStockMinimum() != null ? art.getStockMinimum().doubleValue() : 0.0;
            }
            boolean stockCritique = stockMinimum > 0 && stockActuel <= stockMinimum;
            boolean stockBas = !stockCritique && stockMinimum > 0 && stockActuel <= stockMinimum * 1.5;
            String urgence = stockCritique ? "CRITIQUE" : stockBas ? "ALERTE" : "OK";
            result.add(new ArticleDashboardItem(
                    designation, nbAchats, prixMoyen, prixMoyen, 0.0,
                    stockActuel, stockMinimum, stockCritique, stockBas, urgence, "stable",
                    0.0, 0.0, 0));
        }

        result.sort(Comparator.comparingInt(item -> switch (item.getUrgence()) {
            case "CRITIQUE" -> 0;
            case "ALERTE"   -> 1;
            default         -> 2;
        }));
        return result;
    }

    // ── Advisory : données rapides pour un article précis (sans Prophet) ──

    public ArticleDashboardItem getAdvisoryData(String designation) {
        List<Object[]> priceHistory = factureAchatRepository.findPriceHistoryByDesignation(designation);
        if (priceHistory.isEmpty()) return null;

        double sum = 0;
        double prixDernier = 0;
        int count = 0;
        for (Object[] row : priceHistory) {
            BigDecimal prix = (BigDecimal) row[2];
            if (prix != null) { sum += prix.doubleValue(); prixDernier = prix.doubleValue(); count++; }
        }
        double prixMoyen = count > 0 ? sum / count : 0;
        double prixVariationPct = prixMoyen > 0 ? ((prixDernier - prixMoyen) / prixMoyen) * 100 : 0;
        String tendance = prixVariationPct > 5 ? "hausse" : prixVariationPct < -5 ? "baisse" : "stable";

        List<Article> articles = articleRepository.findByDesignationContainingIgnoreCase(designation);
        double stockActuel = 0.0;
        double stockMinimum = 0.0;
        if (!articles.isEmpty()) {
            Article art = articles.get(0);
            stockActuel = art.getStock1() != null ? art.getStock1().doubleValue() : 0.0;
            stockMinimum = art.getStockMinimum() != null ? art.getStockMinimum().doubleValue() : 0.0;
        }

        boolean stockCritique = stockMinimum > 0 && stockActuel <= stockMinimum;
        boolean stockBas = !stockCritique && stockMinimum > 0 && stockActuel <= stockMinimum * 1.5;
        String urgence = stockCritique ? "CRITIQUE" : (stockBas || "hausse".equals(tendance)) ? "ALERTE" : "OK";

        return new ArticleDashboardItem(designation, count, prixMoyen, prixDernier, prixVariationPct,
                stockActuel, stockMinimum, stockCritique, stockBas, urgence, tendance,
                0.0, 0.0, 0);
    }

    private List<Map<String, Object>> buildPriceHistory(List<Object[]> rows) {
        List<Map<String, Object>> history = new ArrayList<>();
        for (Object[] row : rows) {
            LocalDate date = (LocalDate) row[0];
            BigDecimal prix = (BigDecimal) row[2];
            BigDecimal quantite = (BigDecimal) row[3];
            if (date == null || prix == null) continue;
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", date.toString());
            point.put("prix", prix.doubleValue());
            point.put("quantite", quantite != null ? quantite.doubleValue() : 1.0);
            history.add(point);
        }
        return history;
    }

    private List<Map<String, Object>> buildSalesHistory(List<Object[]> rows) {
        List<Map<String, Object>> sales = new ArrayList<>();
        for (Object[] row : rows) {
            LocalDate date = (LocalDate) row[0];
            BigDecimal quantite = (BigDecimal) row[2];
            if (date == null || quantite == null) continue;
            Map<String, Object> sale = new LinkedHashMap<>();
            sale.put("date", date.toString());
            sale.put("designation", row[1] != null ? row[1].toString() : "");
            sale.put("quantite", quantite.doubleValue());
            sales.add(sale);
        }
        return sales;
    }
}
