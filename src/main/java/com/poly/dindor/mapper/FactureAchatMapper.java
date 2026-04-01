package com.poly.dindor.mapper;

import com.poly.dindor.dto.request.FactureAchatLigneRequest;
import com.poly.dindor.dto.request.FactureAchatRequest;
import com.poly.dindor.dto.request.PaiementAchatRequest;
import com.poly.dindor.dto.response.FactureAchatLigneResponse;
import com.poly.dindor.dto.response.FactureAchatResponse;
import com.poly.dindor.entity.FactureAchat;
import com.poly.dindor.entity.FactureAchatLigne;
import com.poly.dindor.entity.Fournisseur;
import com.poly.dindor.entity.PaiementAchat;

import java.math.BigDecimal;
import java.util.concurrent.atomic.AtomicInteger;

public final class FactureAchatMapper {

    private FactureAchatMapper() {}

    // ── Entity ────────────────────────────────────────────────────────────

    public static FactureAchat toEntity(FactureAchatRequest req, Fournisseur fournisseur) {
        FactureAchat facture = FactureAchat.builder()
            .numeroFacture(req.getNumeroFacture())
            .dateFacture(req.getDateFacture())
            .fournisseur(fournisseur)
            .build();

        AtomicInteger counter = new AtomicInteger(1);
        req.getLignes().stream()
            .map(l -> toLigneEntity(l, facture, counter.getAndIncrement()))
            .forEach(l -> facture.getLignes().add(l));

        if (req.getPaiement() != null) {
            facture.setPaiement(toPaiementEntity(req.getPaiement(), facture));
        }

        facture.recalculerTotaux();
        return facture;
    }

    private static FactureAchatLigne toLigneEntity(FactureAchatLigneRequest req,
                                                    FactureAchat facture, int ordre) {
        FactureAchatLigne ligne = FactureAchatLigne.builder()
            .factureAchat(facture)
            .codeArticle(req.getCodeArticle())
            .designation(req.getDesignation())
            .quantite(req.getQuantite())
            .prixUnitaireHT(req.getPrixUnitaireHT())
            .remise(req.getRemise() != null ? req.getRemise() : BigDecimal.ZERO)
            .tva(req.getTva() != null ? req.getTva() : BigDecimal.ZERO)
            .ordre(req.getOrdre() != null ? req.getOrdre() : ordre)
            .build();
        ligne.calculer();
        return ligne;
    }

    private static PaiementAchat toPaiementEntity(PaiementAchatRequest req, FactureAchat facture) {
        return PaiementAchat.builder()
            .factureAchat(facture)
            .modePaiement(req.getModePaiement() != null
                ? PaiementAchat.ModePaiement.valueOf(req.getModePaiement()) : null)
            .sousMode(req.getSousMode() != null
                ? PaiementAchat.SousMode.valueOf(req.getSousMode()) : null)
            .montantPaye(req.getMontantPaye() != null ? req.getMontantPaye() : BigDecimal.ZERO)
            .montantReste(req.getMontantReste() != null ? req.getMontantReste() : BigDecimal.ZERO)
            .dateEcheance(req.getDateEcheance())
            .numeroTraite(req.getNumeroTraite())
            .dateLimiteCredit(req.getDateLimiteCredit())
            .avecRetenue(Boolean.TRUE.equals(req.getAvecRetenue()))
            .build();
    }

    // ── Response ──────────────────────────────────────────────────────────

    public static FactureAchatResponse toResponse(FactureAchat f) {
        return FactureAchatResponse.builder()
            .id(f.getId())
            .numeroFacture(f.getNumeroFacture())
            .dateFacture(f.getDateFacture())
            .fournisseurId(f.getFournisseur().getId())
            .fournisseurRaisonSociale(f.getFournisseur().getRaisonSociale())
            .fournisseurMatricule(f.getFournisseur().getMatricule())
            .lignes(f.getLignes().stream().map(FactureAchatMapper::toLigneResponse).toList())
            .totalBrut(f.getTotalBrut())
            .totalRemise(f.getTotalRemise())
            .totalHT(f.getTotalHT())
            .totalTVA(f.getTotalTVA())
            .timbreFiscal(f.getTimbreFiscal())
            .netAPayer(f.getNetAPayer())
            .statut(f.getStatut().name())
            .dateCreation(f.getDateCreation())
            .build();
    }

    private static FactureAchatLigneResponse toLigneResponse(FactureAchatLigne l) {
        return FactureAchatLigneResponse.builder()
            .id(l.getId())
            .codeArticle(l.getCodeArticle())
            .designation(l.getDesignation())
            .quantite(l.getQuantite())
            .prixUnitaireHT(l.getPrixUnitaireHT())
            .remise(l.getRemise())
            .prixRemise(l.getPrixRemise())
            .tva(l.getTva())
            .totalHT(l.getTotalHT())
            .montantTVA(l.getMontantTVA())
            .totalTTC(l.getTotalTTC())
            .montantRemise(l.getMontantRemise())
            .ordre(l.getOrdre())
            .build();
    }
}
