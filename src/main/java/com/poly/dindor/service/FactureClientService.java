package com.poly.dindor.service;

import com.poly.dindor.dto.request.FactureClientRequest;
import com.poly.dindor.dto.response.FactureClientResponse;
import com.poly.dindor.dto.response.RapportPeriodeRow;
import com.poly.dindor.dto.response.TopArticleClientResponse;
import com.poly.dindor.dto.response.VenteStatsResponse;
import com.poly.dindor.entity.*;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.mapper.FactureClientMapper;
import com.poly.dindor.repository.ArticleRepository;
import com.poly.dindor.repository.ClientRepository;
import com.poly.dindor.repository.FactureClientRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class FactureClientService {

    private final FactureClientRepository factureRepository;
    private final ClientRepository        clientRepository;
    private final ArticleRepository       articleRepository;
    private final StockService            stockService;

    public FactureClientService(FactureClientRepository factureRepository,
                                 ClientRepository clientRepository,
                                 ArticleRepository articleRepository,
                                 @Lazy StockService stockService) {
        this.factureRepository = factureRepository;
        this.clientRepository  = clientRepository;
        this.articleRepository = articleRepository;
        this.stockService      = stockService;
    }

    // ── Numérotation ──────────────────────────────────────────────────────

    public synchronized String getNextNumeroFacture() {
        LocalDate now  = LocalDate.now();
        String month   = String.format("%02d", now.getMonthValue());
        String year    = String.format("%02d", now.getYear() % 100);
        String prefix  = "F" + month + "/" + year + "%";
        long   maxSeq  = factureRepository.findMaxSeqForPrefix(prefix);
        return String.format("F%s/%s%04d", month, year, maxSeq + 1);
    }

    public synchronized String getNextNumeroBL() {
        LocalDate now  = LocalDate.now();
        String month   = String.format("%02d", now.getMonthValue());
        String year    = String.format("%02d", now.getYear() % 100);
        String prefix  = "BL" + month + "/" + year + "%";
        long   maxSeq  = factureRepository.findMaxSeqForPrefix(prefix);
        return String.format("BL%s/%s%04d", month, year, maxSeq + 1);
    }

    // ── Dernier prix d'un article ─────────────────────────────────────────

    public BigDecimal getLastPrice(String codeArticle) {
        return factureRepository.findLastPriceByCodeArticle(codeArticle).orElse(null);
    }

    // ── Création ──────────────────────────────────────────────────────────

    @Transactional
    public FactureClientResponse create(FactureClientRequest request) {
        if (request.getNumeroFacture() == null || request.getNumeroFacture().isBlank()
                || factureRepository.existsByNumeroFacture(request.getNumeroFacture())) {
            boolean isBL = "BON_LIVRAISON".equalsIgnoreCase(request.getTypeDocument());
            request.setNumeroFacture(isBL ? getNextNumeroBL() : getNextNumeroFacture());
        }

        // Fix 4 : date de facture ne peut pas être dans le futur
        try {
            LocalDate dateFacture = LocalDate.parse(request.getDateFacture());
            if (dateFacture.isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("La date de la facture ne peut pas être dans le futur.");
            }
        } catch (java.time.format.DateTimeParseException e) {
            throw new IllegalArgumentException("Format de date invalide : " + request.getDateFacture());
        }

        // Fix 5 : TVA doit être 0, 6 ou 19
        if (request.getLignes() != null) {
            for (var l : request.getLignes()) {
                BigDecimal tva = l.getTva() != null ? l.getTva() : BigDecimal.ZERO;
                boolean tvaValide = tva.compareTo(BigDecimal.ZERO) == 0
                        || tva.compareTo(new BigDecimal("6")) == 0
                        || tva.compareTo(new BigDecimal("19")) == 0;
                if (!tvaValide) {
                    throw new IllegalArgumentException(
                        "TVA invalide (" + tva + "%). Les valeurs autorisées sont 0, 6 et 19.");
                }
            }
        }

        Client client = null;
        if (request.getClientId() != null) {
            client = clientRepository.findById(request.getClientId()).orElse(null);
        }

        // Validation : une facture doit avoir au moins une ligne
        if (request.getLignes() == null || request.getLignes().isEmpty()) {
            throw new IllegalArgumentException("Une facture client doit contenir au moins une ligne.");
        }

        FactureClient fc = FactureClientMapper.toEntity(request, client);

        // Fix 6 : contrôle du plafond de crédit client
        if (client != null
                && client.getPlafond() != null
                && client.getPlafond().compareTo(BigDecimal.ZERO) > 0
                && fc.getPaiement() != null
                && fc.getPaiement().getModePaiement() == PaiementFactureClient.ModePaiement.CREDIT) {
            BigDecimal soldeFutur = client.getSoldeTotalDu().add(fc.getNetAPayer());
            if (soldeFutur.compareTo(client.getPlafond()) > 0) {
                throw new IllegalStateException(
                    "Plafond de crédit dépassé pour " + client.getNom()
                    + " : solde actuel=" + client.getSoldeTotalDu()
                    + " DT, montant facture=" + fc.getNetAPayer()
                    + " DT, plafond=" + client.getPlafond() + " DT.");
            }
        }

        // Capture prix de revient (PUMP ou prixAchatHT) au moment de la vente
        for (FactureClientLigne ligne : fc.getLignes()) {
            if (ligne.getCodeArticle() != null && !ligne.getCodeArticle().isBlank()) {
                articleRepository.findByCodeArticle(ligne.getCodeArticle()).ifPresent(article -> {
                    BigDecimal pump   = article.getPump();
                    BigDecimal achat  = article.getPrixAchatHT();
                    BigDecimal revient = (pump != null && pump.compareTo(BigDecimal.ZERO) > 0)
                            ? pump : (achat != null ? achat : BigDecimal.ZERO);
                    ligne.setPrixRevient(revient);
                });
            }
        }

        FactureClient saved = factureRepository.save(fc);

        // ── Mise à jour solde client (CREDIT uniquement) ──────────────────
        if (client != null
                && saved.getPaiement() != null
                && saved.getPaiement().getModePaiement() == PaiementFactureClient.ModePaiement.CREDIT) {
            BigDecimal nouveauSolde = client.getSoldeTotalDu().add(saved.getNetAPayer());
            client.setSoldeTotalDu(nouveauSolde);
            clientRepository.save(client);
            saved.setSoldeSurFacture(nouveauSolde);
            factureRepository.save(saved);
        }

        // ── Sorties stock automatiques ──
        stockService.creerSortieFactureClient(saved);

        return FactureClientMapper.toResponse(saved);
    }

    // ── Lecture ───────────────────────────────────────────────────────────

    public List<FactureClientResponse> getAll() {
        return factureRepository.findAllOrdered().stream()
                .map(FactureClientMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<FactureClientResponse> getFiltered(String dateDebutStr, String dateFinStr, String modePaiement, String typeDocument) {
        LocalDate dateDebut = parseDateFrom(dateDebutStr);
        LocalDate dateFin   = parseDateTo(dateFinStr);
        boolean isBL = "BON_LIVRAISON".equalsIgnoreCase(typeDocument);

        PaiementFactureClient.ModePaiement mode = null;
        if (modePaiement != null && !modePaiement.isBlank()) {
            try { mode = PaiementFactureClient.ModePaiement.valueOf(modePaiement.toUpperCase()); } catch (Exception ignored) {}
        }

        List<FactureClient> factures;
        if (isBL) {
            factures = (mode != null)
                    ? factureRepository.findBLsByDateAndMode(dateDebut, dateFin, mode)
                    : factureRepository.findBLsByDate(dateDebut, dateFin);
        } else {
            factures = (mode != null)
                    ? factureRepository.findFacturesByDateAndMode(dateDebut, dateFin, mode)
                    : factureRepository.findFacturesByDate(dateDebut, dateFin);
        }
        return factures.stream()
                .map(FactureClientMapper::toResponse)
                .collect(Collectors.toList());
    }

    public FactureClientResponse getById(Long id) {
        return FactureClientMapper.toResponse(
                factureRepository.findByIdWithLignes(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Facture client introuvable : " + id)));
    }

    // ── Suppression ──────────────────────────────────────────────────────

    @Transactional
    public void delete(Long id) {
        FactureClient fc = factureRepository.findByIdWithLignes(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture client introuvable : " + id));

        // Reverser le solde client si CREDIT et non PAYE
        if (fc.getClient() != null
                && fc.getPaiement() != null
                && fc.getPaiement().getModePaiement() == PaiementFactureClient.ModePaiement.CREDIT
                && fc.getEtatPaiement() != FactureClient.EtatPaiement.PAYE) {
            Client client = fc.getClient();
            BigDecimal nouveau = client.getSoldeTotalDu().subtract(fc.getNetAPayer());
            client.setSoldeTotalDu(nouveau.max(BigDecimal.ZERO));
            clientRepository.save(client);
        }
        // Remettre le stock en place avant de supprimer
        stockService.annulerSortieFactureClient(fc);
        factureRepository.delete(fc);
    }

    // ── Mise à jour état paiement ─────────────────────────────────────────

    @Transactional
    public FactureClientResponse updateEtatPaiement(Long id, String etat) {
        FactureClient fc = factureRepository.findByIdWithLignes(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture client introuvable : " + id));

        FactureClient.EtatPaiement nouvelEtat  = FactureClient.EtatPaiement.valueOf(etat.toUpperCase());
        FactureClient.EtatPaiement ancienEtat  = fc.getEtatPaiement();

        boolean transitionValide = switch (ancienEtat) {
            case EN_ATTENTE -> nouvelEtat == FactureClient.EtatPaiement.PARTIEL
                               || nouvelEtat == FactureClient.EtatPaiement.PAYE;
            case PARTIEL    -> nouvelEtat == FactureClient.EtatPaiement.PAYE;
            case PAYE       -> false;
        };
        if (!transitionValide) {
            throw new IllegalStateException(
                "Transition de paiement invalide : " + ancienEtat + " → " + nouvelEtat);
        }

        fc.setEtatPaiement(nouvelEtat);
        return FactureClientMapper.toResponse(factureRepository.save(fc));
    }

    // ── Statistiques ──────────────────────────────────────────────────────

    public VenteStatsResponse getStats(String dateDebutStr, String dateFinStr) {
        List<FactureClient> factures = factureRepository.findWithLignesForPeriod(
                parseDateFrom(dateDebutStr), parseDateTo(dateFinStr));

        BigDecimal ca = factures.stream()
                .map(FactureClient::getNetAPayer)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        BigDecimal totalQte = factures.stream()
                .flatMap(f -> f.getLignes().stream())
                .map(FactureClientLigne::getQuantite)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        BigDecimal montantCredit = factures.stream()
                .filter(f -> f.getPaiement() != null
                        && f.getPaiement().getModePaiement() == PaiementFactureClient.ModePaiement.CREDIT)
                .map(FactureClient::getNetAPayer)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        BigDecimal montantEspeces = factures.stream()
                .filter(f -> f.getPaiement() != null
                        && f.getPaiement().getModePaiement() == PaiementFactureClient.ModePaiement.ESPECES)
                .map(FactureClient::getNetAPayer)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        Map<String, String>     articleLabel = new LinkedHashMap<>();
        Map<String, BigDecimal> articleQte   = new LinkedHashMap<>();
        Map<String, BigDecimal> articleMt    = new LinkedHashMap<>();

        for (FactureClient fc : factures) {
            for (FactureClientLigne l : fc.getLignes()) {
                String key = (l.getCodeArticle() != null && !l.getCodeArticle().isBlank())
                        ? l.getCodeArticle() : l.getDesignation();
                articleLabel.putIfAbsent(key, l.getDesignation());
                articleQte.merge(key, l.getQuantite(), BigDecimal::add);
                articleMt .merge(key, l.getTotalHT(),  BigDecimal::add);
            }
        }

        List<VenteStatsResponse.DetailArticle> details = articleLabel.keySet().stream()
                .map(key -> {
                    VenteStatsResponse.DetailArticle d = new VenteStatsResponse.DetailArticle();
                    d.setCodeArticle(key);
                    d.setLibelle(articleLabel.get(key));
                    d.setQteSortie(articleQte.get(key).setScale(3, RoundingMode.HALF_UP));
                    d.setMontantHT(articleMt .get(key).setScale(3, RoundingMode.HALF_UP));
                    return d;
                })
                .sorted(Comparator.comparing(VenteStatsResponse.DetailArticle::getQteSortie).reversed())
                .collect(Collectors.toList());

        BigDecimal benefice = factures.stream()
                .flatMap(f -> f.getLignes().stream())
                .filter(l -> l.getPrixRevient() != null && l.getPrixRevient().compareTo(BigDecimal.ZERO) > 0)
                .map(l -> l.getTotalHT().subtract(l.getPrixRevient().multiply(l.getQuantite())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        VenteStatsResponse stats = new VenteStatsResponse();
        stats.setChiffreAffaire(ca);
        stats.setTotalQteVendue(totalQte);
        stats.setNombreBons((long) factures.size());
        stats.setMontantCredit(montantCredit);
        stats.setMontantEspeces(montantEspeces);
        stats.setBenefice(benefice);
        stats.setDetailArticles(details);
        return stats;
    }

    // ── Top articles par client ───────────────────────────────────────────

    public List<TopArticleClientResponse> getTopArticlesByClient(Long clientId, int limit) {
        List<Object[]> rows = factureRepository.findTopArticlesByClient(clientId, limit);
        List<TopArticleClientResponse> result = new ArrayList<>();
        for (Object[] r : rows) {
            result.add(TopArticleClientResponse.builder()
                    .codeArticle(r[0] != null ? r[0].toString() : "")
                    .designation(r[1] != null ? r[1].toString() : "")
                    .unite(r[2] != null ? r[2].toString() : "")
                    .totalQte(r[3] != null ? new java.math.BigDecimal(r[3].toString()).setScale(3, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                    .nbBons(r[4] != null ? ((Number) r[4]).longValue() : 0L)
                    .avgPrix(r[5] != null ? new java.math.BigDecimal(r[5].toString()).setScale(3, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                    .build());
        }
        return result;
    }

    // ── Rapport pivot par période ─────────────────────────────────────────

    public List<RapportPeriodeRow> getRapportPeriode(Long clientId, String dateDebutStr, String dateFinStr) {
        LocalDate dateDebut = parseDateFrom(dateDebutStr);
        LocalDate dateFin   = parseDateTo(dateFinStr);
        List<Object[]> rows = factureRepository.findLignesByClientAndPeriode(clientId, dateDebut, dateFin);
        List<RapportPeriodeRow> result = new ArrayList<>();
        for (Object[] r : rows) {
            result.add(RapportPeriodeRow.builder()
                    .date(r[0].toString())
                    .numeroBL(r[1] != null ? r[1].toString() : "")
                    .designation(r[2] != null ? r[2].toString().trim() : "")
                    .quantite(r[3] != null ? new java.math.BigDecimal(r[3].toString()).setScale(3, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                    .prixUnitaireHT(r[4] != null ? new java.math.BigDecimal(r[4].toString()).setScale(3, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                    .totalHT(r[5] != null ? new java.math.BigDecimal(r[5].toString()).setScale(3, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                    .build());
        }
        return result;
    }

    private static LocalDate parseDateFrom(String s) {
        return s != null && !s.isBlank() ? LocalDate.parse(s) : LocalDate.of(1900, 1, 1);
    }

    private static LocalDate parseDateTo(String s) {
        return s != null && !s.isBlank() ? LocalDate.parse(s) : LocalDate.of(2100, 12, 31);
    }
}
