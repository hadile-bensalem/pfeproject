package com.poly.dindor.service;

import com.poly.dindor.dto.request.AjustementStockRequest;
import com.poly.dindor.dto.response.LotStockResponse;
import com.poly.dindor.dto.response.MouvementStockResponse;
import com.poly.dindor.dto.response.StockArticleResponse;
import com.poly.dindor.dto.response.StockDashboardResponse;
import com.poly.dindor.entity.Article;
import com.poly.dindor.entity.BonLivraison;
import com.poly.dindor.entity.BonLivraisonLigne;
import com.poly.dindor.entity.FactureAchat;
import com.poly.dindor.entity.FactureClient;
import com.poly.dindor.entity.FactureClientLigne;
import com.poly.dindor.entity.FactureAchatLigne;
import com.poly.dindor.entity.LotStock;
import com.poly.dindor.entity.MouvementStock;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.repository.ArticleRepository;
import com.poly.dindor.repository.LotStockRepository;
import com.poly.dindor.repository.MouvementStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockService {

    private final ArticleRepository        articleRepository;
    private final MouvementStockRepository mouvementRepository;
    private final LotStockRepository       lotStockRepository;

    // ── Disponibilité (3 niveaux) ─────────────────────────────────────────

    public enum DisponibiliteStatut { DISPONIBLE, EN_ATTENTE_STOCK, INSUFFISANT }

    public record DisponibiliteResult(
        DisponibiliteStatut statut,
        BigDecimal disponibleReel,
        BigDecimal disponiblePrevu,
        String message
    ) {}

    public DisponibiliteResult verifierDisponibilite(Long articleId, BigDecimal qte) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article introuvable : " + articleId));

        BigDecimal stockActuel   = article.getStock1();
        BigDecimal stockReserve  = article.getStockReserve();
        BigDecimal stockEnAttente = article.getStockEnAttente();

        BigDecimal disponibleReel  = stockActuel.subtract(stockReserve);
        BigDecimal disponiblePrevu = stockActuel.add(stockEnAttente).subtract(stockReserve);

        if (disponibleReel.compareTo(qte) >= 0) {
            return new DisponibiliteResult(DisponibiliteStatut.DISPONIBLE,
                    disponibleReel, disponiblePrevu, "Stock disponible");
        }
        if (disponiblePrevu.compareTo(qte) >= 0) {
            return new DisponibiliteResult(DisponibiliteStatut.EN_ATTENTE_STOCK,
                    disponibleReel, disponiblePrevu,
                    "Stock insuffisant actuellement mais couvert par achats en cours. La commande sera confirmée automatiquement à la validation de la facture fournisseur.");
        }
        return new DisponibiliteResult(DisponibiliteStatut.INSUFFISANT,
                disponibleReel, disponiblePrevu,
                String.format("Stock insuffisant : disponible réel=%.3f, prévu=%.3f, demandé=%.3f",
                        disponibleReel, disponiblePrevu, qte));
    }

    // ── Entrée brouillon (incrémente stock_en_attente) ────────────────────

    @Transactional
    public void entreeStockBrouillon(FactureAchatLigne ligne) {
        if (ligne.getCodeArticle() == null || ligne.getCodeArticle().isBlank()) return;
        articleRepository.findByCodeArticle(ligne.getCodeArticle()).ifPresent(article -> {
            article.setStockEnAttente(article.getStockEnAttente().add(ligne.getQuantite()));
            articleRepository.save(article);

            BigDecimal taux = ligne.getTauxTransformation();
            if (taux != null && taux.compareTo(BigDecimal.ZERO) > 0) {
                List<Article> derives = articleRepository.findByCodeArticleSource(article.getCodeArticle());
                if (!derives.isEmpty()) {
                    Article derive = derives.get(0);
                    BigDecimal qteDeriveEnAttente = ligne.getQuantite().multiply(taux)
                            .setScale(3, RoundingMode.HALF_UP);
                    derive.setStockEnAttente(derive.getStockEnAttente().add(qteDeriveEnAttente));
                    articleRepository.save(derive);
                }
            }
        });
    }

    // ── Annulation brouillon (décrémente stock_en_attente) ───────────────

    @Transactional
    public void annulerStockBrouillon(FactureAchatLigne ligne) {
        if (ligne.getCodeArticle() == null || ligne.getCodeArticle().isBlank()) return;
        articleRepository.findByCodeArticle(ligne.getCodeArticle()).ifPresent(article -> {
            article.setStockEnAttente(article.getStockEnAttente().subtract(ligne.getQuantite()).max(BigDecimal.ZERO));
            articleRepository.save(article);

            BigDecimal taux = ligne.getTauxTransformation();
            if (taux != null && taux.compareTo(BigDecimal.ZERO) > 0) {
                List<Article> derives = articleRepository.findByCodeArticleSource(article.getCodeArticle());
                if (!derives.isEmpty()) {
                    Article derive = derives.get(0);
                    BigDecimal qteDerive = ligne.getQuantite().multiply(taux).setScale(3, RoundingMode.HALF_UP);
                    derive.setStockEnAttente(derive.getStockEnAttente().subtract(qteDerive).max(BigDecimal.ZERO));
                    articleRepository.save(derive);
                }
            }
        });
    }

    // ── Entrée validée (stock_en_attente → stock_actuel + lot) ────────────

    @Transactional
    public void entreeStockValide(FactureAchatLigne ligne, FactureAchat facture) {
        if (ligne.getCodeArticle() == null || ligne.getCodeArticle().isBlank()) return;
        Optional<Article> optArticle = articleRepository.findByCodeArticle(ligne.getCodeArticle());
        if (optArticle.isEmpty()) return;

        Article article = optArticle.get();
        if (article.getCodeArticleSource() != null && !article.getCodeArticleSource().isBlank()) return;

        BigDecimal qte      = ligne.getQuantite();
        BigDecimal pu       = ligne.getPrixUnitaireHT();
        BigDecimal stockAv  = article.getStock1();
        BigDecimal pumpAv   = article.getPump();

        // Déplacer stock_en_attente → stock_actuel
        BigDecimal stockAp = stockAv.add(qte);
        BigDecimal pumpAp  = stockAp.compareTo(BigDecimal.ZERO) == 0 ? pu
                : stockAv.multiply(pumpAv).add(qte.multiply(pu))
                          .divide(stockAp, 3, RoundingMode.HALF_UP);
        article.setStock1(stockAp);
        article.setPump(pumpAp);
        article.setStockEnAttente(article.getStockEnAttente().subtract(qte).max(BigDecimal.ZERO));
        articleRepository.save(article);

        mouvementRepository.save(MouvementStock.builder()
                .article(article).typeMouvement(MouvementStock.TypeMouvement.ENTREE_ACHAT)
                .quantite(qte).prixUnitaire(pu).pumpAvant(pumpAv).pumpApres(pumpAp)
                .stockAvant(stockAv).stockApres(stockAp)
                .referenceDocument(facture.getNumeroFacture())
                .notes("Entrée achat validée — " + facture.getNumeroFacture())
                .build());

        // Article dérivé
        BigDecimal tauxLot      = ligne.getTauxTransformation();
        Article    articleDerive = null;
        BigDecimal qteDeriveInit = null;

        if (tauxLot != null && tauxLot.compareTo(BigDecimal.ZERO) > 0) {
            List<Article> derives = articleRepository.findByCodeArticleSource(article.getCodeArticle());
            if (!derives.isEmpty()) {
                articleDerive = derives.get(0);
                qteDeriveInit = qte.multiply(tauxLot).setScale(3, RoundingMode.HALF_UP);

                BigDecimal stockDerAv = articleDerive.getStock1();
                BigDecimal pumpDerAv  = articleDerive.getPump() != null
                        ? articleDerive.getPump() : BigDecimal.ZERO;
                BigDecimal oldTaux    = articleDerive.getTauxConversion() != null
                        ? articleDerive.getTauxConversion() : BigDecimal.ZERO;
                BigDecimal newTaux    = stockAp.compareTo(BigDecimal.ZERO) == 0 ? tauxLot
                        : stockAv.multiply(oldTaux).add(qte.multiply(tauxLot))
                                  .divide(stockAp, 4, RoundingMode.HALF_UP);

                // Prix unitaire du dérivé = prix source / taux  (même coût total, moins de kg)
                BigDecimal puDerive  = pu.divide(tauxLot, 3, RoundingMode.HALF_UP);
                BigDecimal stockDerAp = stockDerAv.add(qteDeriveInit);
                BigDecimal pumpDerAp  = stockDerAp.compareTo(BigDecimal.ZERO) == 0 ? puDerive
                        : stockDerAv.multiply(pumpDerAv).add(qteDeriveInit.multiply(puDerive))
                                    .divide(stockDerAp, 3, RoundingMode.HALF_UP);

                articleDerive.setStock1(stockDerAp);
                articleDerive.setTauxConversion(newTaux);
                articleDerive.setPump(pumpDerAp);
                articleDerive.setStockEnAttente(
                        articleDerive.getStockEnAttente().subtract(qteDeriveInit).max(BigDecimal.ZERO));
                articleRepository.save(articleDerive);
            }
        }

        // Créer le lot
        lotStockRepository.save(LotStock.builder()
                .factureAchat(facture).fournisseur(facture.getFournisseur())
                .articleOrigine(article).articleDerive(articleDerive)
                .dateEntree(facture.getDateFacture()).prixUnitaire(pu)
                .qteOrigineInitiale(qte).qteOrigineRestante(qte)
                .tauxConversion(tauxLot).qteDeriveInitiale(qteDeriveInit).qteDeriveRestante(qteDeriveInit)
                .actif(true).build());
    }

    // ── Annulation entrée validée (suppression facture) ───────────────────

    @Transactional
    public void annulerEntreeValidee(FactureAchat facture) {
        String ref = facture.getNumeroFacture();
        List<MouvementStock> mouvements = mouvementRepository.findByReferenceDocument(ref);
        for (MouvementStock m : mouvements) {
            if (m.getTypeMouvement() == MouvementStock.TypeMouvement.ENTREE_ACHAT) {
                Article article = m.getArticle();
                article.setStock1(article.getStock1().subtract(m.getQuantite()).max(BigDecimal.ZERO));
                articleRepository.save(article);
            }
        }
        lotStockRepository.deleteByFactureAchatId(facture.getId());
        mouvementRepository.deleteByReferenceDocument(ref);
    }

    // ── Entrée achat (flux legacy — facture déjà validée directement) ─────

    @Transactional
    public void creerEntreeAchat(FactureAchat facture) {
        for (FactureAchatLigne ligne : facture.getLignes()) {
            entreeStockValide(ligne, facture);
        }
    }

    // ── Réservation stock commande ─────────────────────────────────────────

    @Transactional
    public void reserverStock(String codeArticle, BigDecimal qte) {
        articleRepository.findByCodeArticle(codeArticle).ifPresent(a -> {
            a.setStockReserve(a.getStockReserve().add(qte));
            articleRepository.save(a);
        });
    }

    @Transactional
    public void libererReservation(String codeArticle, BigDecimal qte) {
        articleRepository.findByCodeArticle(codeArticle).ifPresent(a -> {
            a.setStockReserve(a.getStockReserve().subtract(qte).max(BigDecimal.ZERO));
            articleRepository.save(a);
        });
    }

    // ── Sortie vente (bon de livraison) ───────────────────────────────────

    @Transactional
    public void creerSortieVente(BonLivraison bl) {
        for (BonLivraisonLigne ligne : bl.getLignes()) {
            if (ligne.getCodeArticle() == null || ligne.getCodeArticle().isBlank()) continue;
            Optional<Article> opt = articleRepository.findByCodeArticle(ligne.getCodeArticle());
            if (opt.isEmpty()) continue;
            processSortie(opt.get(), ligne.getQuantite(), bl.getNumeroBL());
        }
    }

    // ── Sortie facture client ─────────────────────────────────────────────

    @Transactional
    public void creerSortieFactureClient(FactureClient fc) {
        for (FactureClientLigne ligne : fc.getLignes()) {
            if (ligne.getCodeArticle() == null || ligne.getCodeArticle().isBlank()) continue;
            Optional<Article> opt = articleRepository.findByCodeArticle(ligne.getCodeArticle());
            if (opt.isEmpty()) continue;
            processSortie(opt.get(), ligne.getQuantite(), fc.getNumeroFacture());
        }
    }

    // ── Annulation sortie (suppression facture client) ────────────────────

    @Transactional
    public void annulerSortieFactureClient(FactureClient fc) {
        for (FactureClientLigne ligne : fc.getLignes()) {
            if (ligne.getCodeArticle() == null || ligne.getCodeArticle().isBlank()) continue;
            articleRepository.findByCodeArticle(ligne.getCodeArticle()).ifPresent(article -> {
                BigDecimal qte     = ligne.getQuantite();
                BigDecimal stockAv = article.getStock1();
                BigDecimal stockAp = stockAv.add(qte).setScale(3, RoundingMode.HALF_UP);
                article.setStock1(stockAp);
                articleRepository.save(article);
                mouvementRepository.save(MouvementStock.builder()
                        .article(article)
                        .typeMouvement(MouvementStock.TypeMouvement.ANNULATION_VENTE)
                        .quantite(qte)
                        .prixUnitaire(article.getPump())
                        .pumpAvant(article.getPump()).pumpApres(article.getPump())
                        .stockAvant(stockAv).stockApres(stockAp)
                        .referenceDocument(fc.getNumeroFacture())
                        .notes("Annulation vente — " + fc.getNumeroFacture())
                        .build());
            });
        }
    }

    // ── FIFO dispatcher ───────────────────────────────────────────────────

    private void processSortie(Article article, BigDecimal qteVendue, String reference) {
        boolean estDerive = article.getCodeArticleSource() != null
                            && !article.getCodeArticleSource().isBlank();
        if (estDerive) {
            sortieArticleDerive(article, qteVendue, reference);
        } else {
            sortieArticleStandard(article, qteVendue, reference);
        }
    }

    private void sortieArticleStandard(Article article, BigDecimal qteVendue, String reference) {
        List<LotStock> lots = lotStockRepository
                .findByArticleOrigineAndActifTrueOrderByDateEntreeAscIdAsc(article);

        BigDecimal qteRestante = qteVendue;
        Map<Long, BigDecimal> deriveDelta = new LinkedHashMap<>();

        for (LotStock lot : lots) {
            if (qteRestante.compareTo(BigDecimal.ZERO) <= 0) break;
            BigDecimal prise = lot.getQteOrigineRestante().min(qteRestante);
            lot.setQteOrigineRestante(lot.getQteOrigineRestante().subtract(prise));

            if (lot.getArticleDerive() != null && lot.getTauxConversion() != null
                    && lot.getTauxConversion().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal priseDerive = prise.multiply(lot.getTauxConversion())
                        .setScale(3, RoundingMode.HALF_UP);
                lot.setQteDeriveRestante(lot.getQteDeriveRestante().subtract(priseDerive).max(BigDecimal.ZERO));
                deriveDelta.merge(lot.getArticleDerive().getId(), priseDerive, BigDecimal::add);
            }
            if (lot.getQteOrigineRestante().compareTo(BigDecimal.ZERO) <= 0) lot.setActif(false);
            lotStockRepository.save(lot);
            qteRestante = qteRestante.subtract(prise);
        }

        BigDecimal stockAv = article.getStock1();
        if (stockAv.compareTo(qteVendue) < 0) {
            throw new IllegalStateException(
                "Stock insuffisant pour '" + article.getDesignation() + "' (" + article.getCodeArticle()
                + ") : disponible=" + stockAv + ", demandé=" + qteVendue);
        }
        BigDecimal stockAp = stockAv.subtract(qteVendue);
        article.setStock1(stockAp);
        articleRepository.save(article);

        mouvementRepository.save(MouvementStock.builder()
                .article(article).typeMouvement(MouvementStock.TypeMouvement.SORTIE_VENTE)
                .quantite(qteVendue.negate()).prixUnitaire(article.getPump())
                .pumpAvant(article.getPump()).pumpApres(article.getPump())
                .stockAvant(stockAv).stockApres(stockAp)
                .referenceDocument(reference).notes("Sortie vente — " + reference)
                .build());

        for (Map.Entry<Long, BigDecimal> entry : deriveDelta.entrySet()) {
            articleRepository.findById(entry.getKey()).ifPresent(derive -> {
                BigDecimal sav = derive.getStock1();
                BigDecimal sap = sav.subtract(entry.getValue()).max(BigDecimal.ZERO);
                derive.setStock1(sap);
                articleRepository.save(derive);
                mouvementRepository.save(MouvementStock.builder()
                        .article(derive).typeMouvement(MouvementStock.TypeMouvement.SORTIE_DERIVE)
                        .quantite(entry.getValue().negate()).prixUnitaire(derive.getPump())
                        .pumpAvant(derive.getPump()).pumpApres(derive.getPump())
                        .stockAvant(sav).stockApres(sap)
                        .referenceDocument(reference).notes("Sortie dérivé (vente source) — " + reference)
                        .build());
            });
        }
    }

    private void sortieArticleDerive(Article article, BigDecimal qteVendue, String reference) {
        List<LotStock> lots = lotStockRepository.findLotsActifsForDerive(article);
        BigDecimal qteRestante      = qteVendue;
        BigDecimal totalOriginePrise = BigDecimal.ZERO;

        for (LotStock lot : lots) {
            if (qteRestante.compareTo(BigDecimal.ZERO) <= 0) break;
            BigDecimal prise = lot.getQteDeriveRestante().min(qteRestante);
            BigDecimal origineEquivalente = prise.divide(lot.getTauxConversion(), 3, RoundingMode.HALF_UP);
            lot.setQteDeriveRestante(lot.getQteDeriveRestante().subtract(prise));
            lot.setQteOrigineRestante(lot.getQteOrigineRestante().subtract(origineEquivalente).max(BigDecimal.ZERO));
            if (lot.getQteOrigineRestante().compareTo(BigDecimal.ZERO) <= 0) lot.setActif(false);
            lotStockRepository.save(lot);
            qteRestante        = qteRestante.subtract(prise);
            totalOriginePrise  = totalOriginePrise.add(origineEquivalente);
        }

        BigDecimal stockDerAv = article.getStock1();
        if (stockDerAv.compareTo(qteVendue) < 0) {
            throw new IllegalStateException(
                "Stock insuffisant pour '" + article.getDesignation() + "' (" + article.getCodeArticle()
                + ") : disponible=" + stockDerAv + ", demandé=" + qteVendue);
        }
        BigDecimal stockDerAp = stockDerAv.subtract(qteVendue);
        article.setStock1(stockDerAp);
        articleRepository.save(article);

        mouvementRepository.save(MouvementStock.builder()
                .article(article).typeMouvement(MouvementStock.TypeMouvement.SORTIE_VENTE)
                .quantite(qteVendue.negate()).prixUnitaire(article.getPump())
                .pumpAvant(article.getPump()).pumpApres(article.getPump())
                .stockAvant(stockDerAv).stockApres(stockDerAp)
                .referenceDocument(reference).notes("Sortie vente (dérivé) — " + reference)
                .build());

        final BigDecimal deltaOrigine = totalOriginePrise;
        if (deltaOrigine.compareTo(BigDecimal.ZERO) > 0) {
            articleRepository.findByCodeArticle(article.getCodeArticleSource()).ifPresent(source -> {
                BigDecimal sav = source.getStock1();
                BigDecimal sap = sav.subtract(deltaOrigine).max(BigDecimal.ZERO);
                source.setStock1(sap);
                articleRepository.save(source);
                mouvementRepository.save(MouvementStock.builder()
                        .article(source).typeMouvement(MouvementStock.TypeMouvement.SORTIE_DERIVE)
                        .quantite(deltaOrigine.negate()).prixUnitaire(source.getPump())
                        .pumpAvant(source.getPump()).pumpApres(source.getPump())
                        .stockAvant(sav).stockApres(sap)
                        .referenceDocument(reference)
                        .notes("Sortie source (vente " + article.getDesignation() + ") — " + reference)
                        .build());
            });
        }
    }

    // ── Ajustement manuel ─────────────────────────────────────────────────

    @Transactional
    public MouvementStockResponse creerAjustement(AjustementStockRequest request) {
        Article article = articleRepository.findById(request.getArticleId())
                .orElseThrow(() -> new ResourceNotFoundException("Article introuvable : " + request.getArticleId()));
        BigDecimal stockAv  = article.getStock1();
        BigDecimal quantite = request.getQuantite();
        boolean positif     = quantite.compareTo(BigDecimal.ZERO) > 0;
        BigDecimal stockAp  = stockAv.add(quantite).max(BigDecimal.ZERO);
        article.setStock1(stockAp);
        articleRepository.save(article);
        MouvementStock m = MouvementStock.builder()
                .article(article)
                .typeMouvement(positif
                        ? MouvementStock.TypeMouvement.AJUSTEMENT_POSITIF
                        : MouvementStock.TypeMouvement.AJUSTEMENT_NEGATIF)
                .quantite(quantite).prixUnitaire(article.getPump())
                .pumpAvant(article.getPump()).pumpApres(article.getPump())
                .stockAvant(stockAv).stockApres(stockAp)
                .referenceDocument(request.getReferenceDocument()).notes(request.getNotes())
                .build();
        mouvementRepository.save(m);
        return toMouvementResponse(m);
    }

    // ── Initialisation stock (inventaire physique) ────────────────────────

    @Transactional
    public MouvementStockResponse initialiserStock(com.poly.dindor.dto.request.InventaireRequest req) {
        Article article = articleRepository.findById(req.getArticleId())
                .orElseThrow(() -> new ResourceNotFoundException("Article introuvable : " + req.getArticleId()));

        BigDecimal stockAv     = article.getStock1();
        BigDecimal nouvelleQte = req.getQuantite().setScale(3, RoundingMode.HALF_UP);
        BigDecimal prixUnit    = (req.getPrixUnitaire() != null && req.getPrixUnitaire().compareTo(BigDecimal.ZERO) > 0)
                ? req.getPrixUnitaire().setScale(3, RoundingMode.HALF_UP)
                : article.getPump();

        article.setStock1(nouvelleQte);
        if (req.getPrixUnitaire() != null && req.getPrixUnitaire().compareTo(BigDecimal.ZERO) > 0) {
            article.setPrixAchatHT(prixUnit);
            article.setPump(prixUnit);
        }
        articleRepository.save(article);

        MouvementStock m = MouvementStock.builder()
                .article(article)
                .typeMouvement(MouvementStock.TypeMouvement.INVENTAIRE)
                .quantite(nouvelleQte)
                .prixUnitaire(prixUnit)
                .pumpAvant(stockAv)
                .pumpApres(prixUnit)
                .stockAvant(stockAv)
                .stockApres(nouvelleQte)
                .referenceDocument("INV")
                .notes("Initialisation stock — " + article.getCodeArticle())
                .build();

        mouvementRepository.save(m);
        return toMouvementResponse(m);
    }

    // ── Seuil minimum ─────────────────────────────────────────────────────

    @Transactional
    public void updateStockMinimum(Long articleId, BigDecimal stockMinimum) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article introuvable : " + articleId));
        article.setStockMinimum(stockMinimum);
        articleRepository.save(article);
    }

    // ── Tableau de bord ───────────────────────────────────────────────────

    public StockDashboardResponse getDashboard() {
        List<Article> articles = articleRepository.findAll();

        BigDecimal valeurTotale = articles.stream()
                .filter(a -> a.getCodeArticleSource() == null || a.getCodeArticleSource().isBlank())
                .map(a -> a.getStock1().multiply(a.getPump()))
                .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(3, RoundingMode.HALF_UP);

        long enAlerte = articles.stream()
                .filter(a -> a.getCodeArticleSource() == null || a.getCodeArticleSource().isBlank())
                .filter(a -> a.getStock1().compareTo(BigDecimal.ZERO) > 0
                        && a.getStock1().compareTo(a.getStockMinimum()) <= 0)
                .count();
        long enRupture = articles.stream()
                .filter(a -> a.getCodeArticleSource() == null || a.getCodeArticleSource().isBlank())
                .filter(a -> a.getStock1().compareTo(BigDecimal.ZERO) <= 0).count();

        Map<String, List<Article>> parFamille = articles.stream()
                .filter(a -> a.getCodeArticleSource() == null || a.getCodeArticleSource().isBlank())
                .collect(Collectors.groupingBy(
                        a -> (a.getFamille() != null && !a.getFamille().isBlank()) ? a.getFamille() : "Autre"));

        List<StockDashboardResponse.FamilleValeur> famillesValeur = parFamille.entrySet().stream()
                .map(e -> {
                    BigDecimal val = e.getValue().stream()
                            .map(a -> a.getStock1().multiply(a.getPump()))
                            .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(3, RoundingMode.HALF_UP);
                    StockDashboardResponse.FamilleValeur fv = new StockDashboardResponse.FamilleValeur();
                    fv.setFamille(e.getKey()); fv.setValeur(val);
                    fv.setNombreArticles((long) e.getValue().size());
                    return fv;
                })
                .sorted(Comparator.comparing(StockDashboardResponse.FamilleValeur::getValeur).reversed())
                .collect(Collectors.toList());

        StockDashboardResponse response = new StockDashboardResponse();
        response.setValeurTotale(valeurTotale);
        response.setNombreArticles(articles.size());
        response.setArticlesEnAlerte(enAlerte);
        response.setArticlesEnRupture(enRupture);
        response.setParFamille(famillesValeur);
        return response;
    }

    // ── Stock par article ─────────────────────────────────────────────────

    public List<StockArticleResponse> getStockArticles() {
        return articleRepository.findAll().stream()
                .map(this::toStockArticleResponse)
                .sorted(Comparator.comparing(StockArticleResponse::getDesignation))
                .collect(Collectors.toList());
    }

    private StockArticleResponse toStockArticleResponse(Article a) {
        boolean estDerive = a.getCodeArticleSource() != null && !a.getCodeArticleSource().isBlank();
        BigDecimal stock         = a.getStock1();
        BigDecimal stockReserve  = a.getStockReserve();
        BigDecimal stockEnAttente = a.getStockEnAttente();
        BigDecimal disponibleReel  = stock.subtract(stockReserve).max(BigDecimal.ZERO);
        BigDecimal disponiblePrevu = stock.add(stockEnAttente).subtract(stockReserve).max(BigDecimal.ZERO);

        StockArticleResponse r = new StockArticleResponse();
        r.setId(a.getId());
        r.setCodeArticle(a.getCodeArticle());
        r.setDesignation(a.getDesignation());
        r.setFamille((a.getFamille() != null && !a.getFamille().isBlank()) ? a.getFamille() : "—");
        r.setUnite(a.getUnite());
        r.setStock(stock);
        r.setStockReserve(stockReserve);
        r.setStockEnAttente(stockEnAttente);
        r.setDisponibleReel(disponibleReel);
        r.setDisponiblePrevu(disponiblePrevu);
        r.setStockMinimum(a.getStockMinimum().setScale(3, RoundingMode.HALF_UP));
        r.setPump(a.getPump().setScale(3, RoundingMode.HALF_UP));
        r.setValeurStock(estDerive ? BigDecimal.ZERO : stock.multiply(a.getPump()).setScale(3, RoundingMode.HALF_UP));
        r.setEnAlerte(!estDerive && stock.compareTo(BigDecimal.ZERO) > 0 && stock.compareTo(a.getStockMinimum()) <= 0);
        r.setEnRupture(!estDerive && disponibleReel.compareTo(BigDecimal.ZERO) <= 0);
        r.setEstDerive(estDerive);
        r.setCodeArticleSource(a.getCodeArticleSource());
        return r;
    }

    // ── Lots d'un article ─────────────────────────────────────────────────

    public List<LotStockResponse> getLotsArticle(Long articleId) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article introuvable : " + articleId));
        return lotStockRepository.findByArticleOrigineOrderByDateEntreeDescIdDesc(article)
                .stream().map(this::toLotStockResponse).collect(Collectors.toList());
    }

    public BigDecimal getTauxMoyen(Long articleId) {
        BigDecimal taux = lotStockRepository.getTauxMoyenPondere(articleId);
        return taux != null ? taux.setScale(4, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }

    // ── Lots expirés (appelé par scheduler) ───────────────────────────────

    @Transactional
    public void desactiverLotsPerimes() {
        LocalDate today = LocalDate.now();
        lotStockRepository.findAll().stream()
                .filter(l -> Boolean.TRUE.equals(l.getActif())
                        && l.getDatePeremption() != null
                        && !l.getDatePeremption().isAfter(today))
                .forEach(l -> {
                    l.setActif(false);
                    lotStockRepository.save(l);
                });
    }

    public List<LotStock> findLotsProchesPeremption(int joursAvant) {
        LocalDate limite = LocalDate.now().plusDays(joursAvant);
        return lotStockRepository.findAll().stream()
                .filter(l -> Boolean.TRUE.equals(l.getActif())
                        && l.getDatePeremption() != null
                        && !l.getDatePeremption().isAfter(limite)
                        && l.getDatePeremption().isAfter(LocalDate.now()))
                .collect(Collectors.toList());
    }

    // ── Historique mouvements ─────────────────────────────────────────────

    public List<MouvementStockResponse> getMouvements() {
        return mouvementRepository.findAllOrdered().stream()
                .map(this::toMouvementResponse).collect(Collectors.toList());
    }

    public List<MouvementStockResponse> getMouvementsByArticle(Long articleId) {
        return mouvementRepository.findByArticleId(articleId).stream()
                .map(this::toMouvementResponse).collect(Collectors.toList());
    }

    // ── Mappers ───────────────────────────────────────────────────────────

    private LotStockResponse toLotStockResponse(LotStock l) {
        LotStockResponse r = new LotStockResponse();
        r.setId(l.getId());
        r.setNumeroFacture(l.getFactureAchat().getNumeroFacture());
        r.setFournisseurNom(l.getFournisseur().getRaisonSociale());
        r.setFournisseurMatricule(l.getFournisseur().getMatricule());
        r.setDateEntree(l.getDateEntree());
        r.setPrixUnitaire(l.getPrixUnitaire());
        r.setQteOrigineInitiale(l.getQteOrigineInitiale());
        r.setQteOrigineRestante(l.getQteOrigineRestante());
        r.setTauxConversion(l.getTauxConversion());
        r.setQteDeriveInitiale(l.getQteDeriveInitiale());
        r.setQteDeriveRestante(l.getQteDeriveRestante());
        r.setActif(Boolean.TRUE.equals(l.getActif()));
        r.setArticleOrigineCode(l.getArticleOrigine().getCodeArticle());
        r.setArticleOrigineDesignation(l.getArticleOrigine().getDesignation());
        if (l.getArticleDerive() != null) {
            r.setArticleDeriveCode(l.getArticleDerive().getCodeArticle());
            r.setArticleDeriveDesignation(l.getArticleDerive().getDesignation());
        }
        return r;
    }

    private MouvementStockResponse toMouvementResponse(MouvementStock m) {
        MouvementStockResponse r = new MouvementStockResponse();
        r.setId(m.getId()); r.setCodeArticle(m.getArticle().getCodeArticle());
        r.setDesignation(m.getArticle().getDesignation());
        r.setTypeMouvement(m.getTypeMouvement().name());
        r.setQuantite(m.getQuantite()); r.setPrixUnitaire(m.getPrixUnitaire());
        r.setPumpApres(m.getPumpApres()); r.setStockAvant(m.getStockAvant());
        r.setStockApres(m.getStockApres()); r.setReferenceDocument(m.getReferenceDocument());
        r.setNotes(m.getNotes());
        r.setDateOperation(m.getDateOperation() != null ? m.getDateOperation().toString() : null);
        return r;
    }
}
