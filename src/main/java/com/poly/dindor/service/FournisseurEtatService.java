package com.poly.dindor.service;

import com.poly.dindor.dto.request.PaiementFournisseurRequest;
import com.poly.dindor.dto.response.FournisseurEtatResponse;
import com.poly.dindor.dto.response.TransactionFournisseurResponse;
import com.poly.dindor.entity.FactureAchat;
import com.poly.dindor.entity.Fournisseur;
import com.poly.dindor.entity.PaiementAchat;
import com.poly.dindor.entity.PaiementFournisseur;
import com.poly.dindor.repository.FactureAchatRepository;
import com.poly.dindor.repository.FournisseurRepository;
import com.poly.dindor.repository.PaiementFournisseurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FournisseurEtatService {

    private final FournisseurRepository             fournisseurRepository;
    private final FactureAchatRepository            factureAchatRepository;
    private final PaiementFournisseurRepository     paiementFournisseurRepository;

    // ── État global ───────────────────────────────────────────────────────────

    public List<FournisseurEtatResponse> getEtatFournisseurs() {
        List<FactureAchat> toutes = factureAchatRepository.findAllNonBrouillon(FactureAchat.StatutFacture.BROUILLON);

        Map<Long, List<FactureAchat>> parFournisseur = toutes.stream()
                .collect(Collectors.groupingBy(f -> f.getFournisseur().getId()));

        // Tous les paiements supplémentaires (PaiementFournisseur)
        Map<Long, List<PaiementFournisseur>> addlPaiements = paiementFournisseurRepository.findAll()
                .stream().collect(Collectors.groupingBy(p -> p.getFournisseur().getId()));

        List<Fournisseur> fournisseurs = fournisseurRepository.findAll();

        return fournisseurs.stream()
                .filter(f -> parFournisseur.containsKey(f.getId()))
                .map(f -> {
                    BigDecimal solde            = BigDecimal.ZERO;
                    BigDecimal traitementEnCours = BigDecimal.ZERO;

                    for (FactureAchat fa : parFournisseur.get(f.getId())) {
                        solde = solde.add(fa.getNetAPayer());
                        PaiementAchat p = fa.getPaiement();
                        if (p != null) {
                            solde = solde.subtract(p.getMontantPaye());
                            if (p.getSousMode() == PaiementAchat.SousMode.ACOMPTE_TRAITE) {
                                traitementEnCours = traitementEnCours.add(p.getMontantReste());
                            }
                        }
                    }

                    // Déduire les règlements supplémentaires
                    for (PaiementFournisseur pf : addlPaiements.getOrDefault(f.getId(), List.of())) {
                        solde = solde.subtract(pf.getMontant());
                    }

                    return FournisseurEtatResponse.builder()
                            .fournisseurId(f.getId())
                            .nom(f.getRaisonSociale())
                            .matricule(f.getMatricule() != null ? f.getMatricule() : "")
                            .solde(solde)
                            .traitementEnCours(traitementEnCours)
                            .build();
                })
                .sorted(Comparator.comparing(FournisseurEtatResponse::getNom))
                .collect(Collectors.toList());
    }

    // ── Grand livre d'un fournisseur ──────────────────────────────────────────

    public List<TransactionFournisseurResponse> getTransactionsByFournisseur(Long fournisseurId) {
        List<FactureAchat> factures = factureAchatRepository
                .findNonBrouillonByFournisseur(fournisseurId, FactureAchat.StatutFacture.BROUILLON);
        List<PaiementFournisseur> addlPaiements = paiementFournisseurRepository
                .findByFournisseurIdOrderByDatePaiementAsc(fournisseurId);

        // ── Lignes intermédiaires triables ─────────────────────────────────────
        record RawLine(LocalDate date, int priority, BigDecimal debit, BigDecimal credit,
                       TransactionFournisseurResponse.TransactionFournisseurResponseBuilder builder) {}

        List<RawLine> lines = new ArrayList<>();

        for (FactureAchat fa : factures) {
            // Ligne ACHAT (débit)
            lines.add(new RawLine(fa.getDateFacture(), 0,
                    fa.getNetAPayer(), BigDecimal.ZERO,
                    TransactionFournisseurResponse.builder()
                            .id(fa.getId())
                            .type("Achat")
                            .numeroFacture(fa.getNumeroFacture())
                            .date(fa.getDateFacture().toString())
                            .debit(fa.getNetAPayer())
                            .credit(BigDecimal.ZERO)
                            .modePaiement("Achat")
                            .espece(BigDecimal.ZERO)));

            // Ligne paiement initial (si espèces > 0)
            PaiementAchat p = fa.getPaiement();
            if (p != null && p.getMontantPaye().compareTo(BigDecimal.ZERO) > 0) {
                String mode   = modeLabel(p);
                BigDecimal esp = p.getSousMode() == PaiementAchat.SousMode.TOUT_ESPECES
                        ? p.getMontantPaye() : BigDecimal.ZERO;
                lines.add(new RawLine(fa.getDateFacture(), 1,
                        BigDecimal.ZERO, p.getMontantPaye(),
                        TransactionFournisseurResponse.builder()
                                .id(p.getId())
                                .type(mode)
                                .numeroFacture(fa.getNumeroFacture())
                                .date(fa.getDateFacture().toString())
                                .debit(BigDecimal.ZERO)
                                .credit(p.getMontantPaye())
                                .modePaiement(mode)
                                .numeroTraite(p.getNumeroTraite())
                                .echeance(p.getDateEcheance()     != null ? p.getDateEcheance().toString()
                                        : p.getDateLimiteCredit() != null ? p.getDateLimiteCredit().toString()
                                        : null)
                                .espece(esp)));
            }
        }

        // Règlements supplémentaires (PaiementFournisseur)
        for (PaiementFournisseur pf : addlPaiements) {
            BigDecimal esp = pf.getModePaiement() == PaiementFournisseur.ModePaiement.ESPECE
                    ? pf.getMontant() : BigDecimal.ZERO;
            lines.add(new RawLine(pf.getDatePaiement(), 2,
                    BigDecimal.ZERO, pf.getMontant(),
                    TransactionFournisseurResponse.builder()
                            .id(pf.getId())
                            .paiementFournisseurId(pf.getId())
                            .type("Règlement")
                            .numeroFacture(pf.getNumeroFacture())
                            .date(pf.getDatePaiement().toString())
                            .debit(BigDecimal.ZERO)
                            .credit(pf.getMontant())
                            .modePaiement(pf.getModePaiement().name())
                            .numeroTraite(pf.getNumeroPaiement())
                            .echeance(pf.getEcheance() != null ? pf.getEcheance().toString() : null)
                            .espece(esp)));
        }

        // Tri chronologique (date ↑, puis priorité : achat→paiement initial→règlement)
        lines.sort(Comparator.comparing(RawLine::date).thenComparingInt(RawLine::priority));

        // Calcul du solde cumulé
        BigDecimal soldeCumule = BigDecimal.ZERO;
        List<TransactionFournisseurResponse> result = new ArrayList<>();
        for (RawLine l : lines) {
            soldeCumule = soldeCumule.add(l.debit()).subtract(l.credit());
            result.add(l.builder().soldeCumule(soldeCumule).build());
        }
        return result;
    }

    // ── CRUD règlements ────────────────────────────────────────────────────────

    @Transactional
    public void addPaiement(Long fournisseurId, PaiementFournisseurRequest req) {
        Fournisseur f = fournisseurRepository.findById(fournisseurId)
                .orElseThrow(() -> new RuntimeException("Fournisseur introuvable : " + fournisseurId));
        paiementFournisseurRepository.save(PaiementFournisseur.builder()
                .fournisseur(f)
                .montant(req.getMontant())
                .datePaiement(req.getDatePaiement())
                .modePaiement(req.getModePaiement())
                .numeroPaiement(req.getNumeroPaiement())
                .echeance(req.getEcheance())
                .banque(req.getBanque())
                .remarque(req.getRemarque())
                .numeroFacture(req.getNumeroFacture())
                .build());
    }

    @Transactional
    public void deletePaiement(Long paiementId) {
        paiementFournisseurRepository.deleteById(paiementId);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private String modeLabel(PaiementAchat p) {
        if (p.getSousMode() == null) {
            return p.getModePaiement() == PaiementAchat.ModePaiement.ESPECES ? "Espèces" : "Paiement";
        }
        return switch (p.getSousMode()) {
            case TOUT_ESPECES   -> "Espèces";
            case ACOMPTE_TRAITE -> "TRAITE";
            case ACOMPTE_CREDIT -> "Crédit";
        };
    }
}
