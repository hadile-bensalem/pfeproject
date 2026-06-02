package com.poly.dindor.service;

import com.poly.dindor.dto.request.BonLivraisonRequest;
import com.poly.dindor.dto.response.BonLivraisonResponse;
import com.poly.dindor.dto.response.RapportPeriodeRow;
import com.poly.dindor.dto.response.TopArticleClientResponse;
import com.poly.dindor.dto.response.VenteStatsResponse;
import com.poly.dindor.entity.*;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.mapper.BonLivraisonMapper;
import com.poly.dindor.repository.ArticleRepository;
import com.poly.dindor.repository.BonLivraisonRepository;
import com.poly.dindor.repository.ClientRepository;
import com.poly.dindor.repository.TransporteurRepository;
import com.poly.dindor.repository.VehiculeRepository;
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
public class BonLivraisonService {

    private final BonLivraisonRepository  blRepository;
    private final ClientRepository        clientRepository;
    private final ArticleRepository       articleRepository;
    private final TransporteurRepository  transporteurRepository;
    private final VehiculeRepository      vehiculeRepository;
    private final StockService            stockService;

    public BonLivraisonService(BonLivraisonRepository blRepository,
                                ClientRepository clientRepository,
                                ArticleRepository articleRepository,
                                TransporteurRepository transporteurRepository,
                                VehiculeRepository vehiculeRepository,
                                @Lazy StockService stockService) {
        this.blRepository          = blRepository;
        this.clientRepository      = clientRepository;
        this.articleRepository     = articleRepository;
        this.transporteurRepository = transporteurRepository;
        this.vehiculeRepository    = vehiculeRepository;
        this.stockService          = stockService;
    }

    // ── Numérotation B{MM}/{YY}{NNNN} ────────────────────────────────────

    public String getNextNumeroBL() {
        LocalDate now     = LocalDate.now();
        String month      = String.format("%02d", now.getMonthValue());
        String year       = String.format("%02d", now.getYear() % 100);
        String prefix     = "B" + month + "/" + year + "%";
        long   maxSeq     = blRepository.findMaxSeqForPrefix(prefix);
        return String.format("B%s/%s%04d", month, year, maxSeq + 1);
    }

    // ── Dernier prix d'un article ─────────────────────────────────────────

    public BigDecimal getLastPrice(String codeArticle) {
        return blRepository.findLastPriceByCodeArticle(codeArticle).orElse(null);
    }

    // ── Création ──────────────────────────────────────────────────────────

    @Transactional
    public BonLivraisonResponse create(BonLivraisonRequest request) {
        if (request.getNumeroBL() == null || request.getNumeroBL().isBlank()
                || blRepository.existsByNumeroBL(request.getNumeroBL())) {
            request.setNumeroBL(getNextNumeroBL());
        }

        Client client = null;
        if (request.getClientId() != null) {
            client = clientRepository.findById(request.getClientId()).orElse(null);
        }

        // Résoudre transporteur et véhicule depuis les IDs, en copiant le snapshot texte
        if (request.getTransporteurId() != null) {
            transporteurRepository.findById(request.getTransporteurId()).ifPresent(t -> {
                request.setTransporteurNom(t.getNom());
            });
        }
        if (request.getVehiculeId() != null) {
            vehiculeRepository.findById(request.getVehiculeId()).ifPresent(v -> {
                request.setVehiculeNumero(v.getImmatriculation());
            });
        }

        // Validation : un BL doit avoir au moins une ligne
        if (request.getLignes() == null || request.getLignes().isEmpty()) {
            throw new IllegalArgumentException("Un bon de livraison doit contenir au moins une ligne.");
        }

        BonLivraison bl = BonLivraisonMapper.toEntity(request, client);

        // Attacher les FKs transporteur / véhicule
        if (request.getTransporteurId() != null) {
            transporteurRepository.findById(request.getTransporteurId()).ifPresent(bl::setTransporteur);
        }
        if (request.getVehiculeId() != null) {
            vehiculeRepository.findById(request.getVehiculeId()).ifPresent(bl::setVehicule);
        }

        // Capture prix de revient (PUMP ou prixAchatHT) au moment de la vente
        for (BonLivraisonLigne ligne : bl.getLignes()) {
            if (ligne.getCodeArticle() != null && !ligne.getCodeArticle().isBlank()) {
                articleRepository.findByCodeArticle(ligne.getCodeArticle()).ifPresent(article -> {
                    BigDecimal pump = article.getPump();
                    BigDecimal achat = article.getPrixAchatHT();
                    BigDecimal revient = (pump != null && pump.compareTo(BigDecimal.ZERO) > 0)
                            ? pump : (achat != null ? achat : BigDecimal.ZERO);
                    ligne.setPrixRevient(revient);
                });
            }
        }

        BonLivraison saved = blRepository.save(bl);

        // ── Mise à jour solde client (CREDIT uniquement) ──────────────────
        if (client != null
                && saved.getPaiement() != null
                && saved.getPaiement().getModePaiement() == PaiementVente.ModePaiement.CREDIT) {
            BigDecimal nouveauSolde = client.getSoldeTotalDu().add(saved.getNetAPayer());
            client.setSoldeTotalDu(nouveauSolde);
            clientRepository.save(client);
            saved.setSoldeSurBL(nouveauSolde);
            blRepository.save(saved);
        }

        // ── Sorties stock automatiques ──
        stockService.creerSortieVente(saved);

        return BonLivraisonMapper.toResponse(saved);
    }

    // ── Lecture ───────────────────────────────────────────────────────────

    public List<BonLivraisonResponse> getAll() {
        return blRepository.findAllOrdered().stream()
                .map(BonLivraisonMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<BonLivraisonResponse> getFiltered(String dateDebutStr, String dateFinStr, String modePaiement) {
        LocalDate dateDebut = parseDateFrom(dateDebutStr);
        LocalDate dateFin   = parseDateTo(dateFinStr);
        PaiementVente.ModePaiement mode = null;
        if (modePaiement != null && !modePaiement.isBlank()) {
            try { mode = PaiementVente.ModePaiement.valueOf(modePaiement.toUpperCase()); } catch (Exception ignored) {}
        }
        List<BonLivraison> bons = (mode != null)
                ? blRepository.findFilteredByDateAndMode(dateDebut, dateFin, mode)
                : blRepository.findFilteredByDate(dateDebut, dateFin);
        return bons.stream()
                .map(BonLivraisonMapper::toResponse)
                .collect(Collectors.toList());
    }

    public BonLivraisonResponse getById(Long id) {
        return BonLivraisonMapper.toResponse(
                blRepository.findByIdWithLignes(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Bon de livraison introuvable : " + id)));
    }

    // ── Suppression ──────────────────────────────────────────────────────

    @Transactional
    public void delete(Long id) {
        BonLivraison bl = blRepository.findByIdWithLignes(id)
                .orElseThrow(() -> new ResourceNotFoundException("BL introuvable : " + id));

        // Reverser le solde client si CREDIT
        if (bl.getClient() != null
                && bl.getPaiement() != null
                && bl.getPaiement().getModePaiement() == PaiementVente.ModePaiement.CREDIT
                && bl.getEtatPaiement() != BonLivraison.EtatPaiement.PAYE) {
            Client client = bl.getClient();
            BigDecimal nouveau = client.getSoldeTotalDu().subtract(bl.getNetAPayer());
            client.setSoldeTotalDu(nouveau.max(BigDecimal.ZERO));
            clientRepository.save(client);
        }
        blRepository.delete(bl);
    }

    // ── Mise à jour état paiement ─────────────────────────────────────────

    @Transactional
    public BonLivraisonResponse updateEtatPaiement(Long id, String etat) {
        BonLivraison bl = blRepository.findByIdWithLignes(id)
                .orElseThrow(() -> new ResourceNotFoundException("BL introuvable : " + id));
        bl.setEtatPaiement(BonLivraison.EtatPaiement.valueOf(etat.toUpperCase()));
        return BonLivraisonMapper.toResponse(blRepository.save(bl));
    }

    // ── Statistiques ──────────────────────────────────────────────────────

    public VenteStatsResponse getStats(String dateDebutStr, String dateFinStr) {
        List<BonLivraison> bons = blRepository.findWithLignesForPeriod(
                parseDateFrom(dateDebutStr), parseDateTo(dateFinStr));

        BigDecimal ca = bons.stream()
                .map(BonLivraison::getNetAPayer)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        BigDecimal totalQte = bons.stream()
                .flatMap(b -> b.getLignes().stream())
                .map(BonLivraisonLigne::getQuantite)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        BigDecimal montantCredit = bons.stream()
                .filter(b -> b.getPaiement() != null
                        && b.getPaiement().getModePaiement() == PaiementVente.ModePaiement.CREDIT)
                .map(BonLivraison::getNetAPayer)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        BigDecimal montantEspeces = bons.stream()
                .filter(b -> b.getPaiement() != null
                        && b.getPaiement().getModePaiement() == PaiementVente.ModePaiement.ESPECES)
                .map(BonLivraison::getNetAPayer)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        Map<String, String>     articleLabel = new LinkedHashMap<>();
        Map<String, BigDecimal> articleQte   = new LinkedHashMap<>();
        Map<String, BigDecimal> articleMt    = new LinkedHashMap<>();

        for (BonLivraison bl : bons) {
            for (BonLivraisonLigne l : bl.getLignes()) {
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

        BigDecimal benefice = bons.stream()
                .flatMap(b -> b.getLignes().stream())
                .filter(l -> l.getPrixRevient() != null && l.getPrixRevient().compareTo(BigDecimal.ZERO) > 0)
                .map(l -> l.getTotalHT().subtract(l.getPrixRevient().multiply(l.getQuantite())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);

        VenteStatsResponse stats = new VenteStatsResponse();
        stats.setChiffreAffaire(ca);
        stats.setTotalQteVendue(totalQte);
        stats.setNombreBons((long) bons.size());
        stats.setMontantCredit(montantCredit);
        stats.setMontantEspeces(montantEspeces);
        stats.setBenefice(benefice);
        stats.setDetailArticles(details);
        return stats;
    }

    // ── Top articles par client ───────────────────────────────────────────

    public List<TopArticleClientResponse> getTopArticlesByClient(Long clientId, int limit) {
        List<Object[]> rows = blRepository.findTopArticlesByClient(clientId, limit);
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
        List<Object[]> rows = blRepository.findLignesByClientAndPeriode(clientId, dateDebut, dateFin);
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

    public BonLivraison findEntityById(Long id) {
        return blRepository.findByIdWithLignes(id)
                .orElseThrow(() -> new ResourceNotFoundException("BL introuvable : " + id));
    }

    private static LocalDate parseDateFrom(String s) {
        return s != null && !s.isBlank() ? LocalDate.parse(s) : LocalDate.of(1900, 1, 1);
    }

    private static LocalDate parseDateTo(String s) {
        return s != null && !s.isBlank() ? LocalDate.parse(s) : LocalDate.of(2100, 12, 31);
    }
}
