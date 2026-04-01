package com.poly.dindor.mapper;

import com.poly.dindor.dto.request.RetenueSourceLigneRequest;
import com.poly.dindor.dto.request.RetenueSourceRequest;
import com.poly.dindor.dto.response.RetenueSourceLigneResponse;
import com.poly.dindor.dto.response.RetenueSourceResponse;
import com.poly.dindor.entity.Fournisseur;
import com.poly.dindor.entity.RetenueSource;
import com.poly.dindor.entity.RetenueSourceLigne;

import java.util.concurrent.atomic.AtomicInteger;

public final class RetenueSourceMapper {

    private RetenueSourceMapper() {}

    // ── Entity ─────────────────────────────────────────────────────────────

    public static RetenueSource toEntity(RetenueSourceRequest req, Fournisseur fournisseur) {
        AtomicInteger counter = new AtomicInteger(1);

        // Build the parent first (without lignes) to get the reference for back-links
        RetenueSource rs = RetenueSource.builder()
                .numeroDocument(req.getNumeroDocument())
                .dateRetenue(req.getDateRetenue())
                .lieuRetenue(req.getLieuRetenue())
                .fournisseur(fournisseur)
                .build();

        // Build each ligne, set the bidirectional link, add to parent collection
        req.getLignes().forEach(l -> {
            RetenueSourceLigne ligne = toLigneEntity(l, counter.getAndIncrement());
            ligne.setRetenueSource(rs);
            rs.getLignes().add(ligne);
        });

        rs.recalculerTotaux();
        return rs;
    }

    private static RetenueSourceLigne toLigneEntity(RetenueSourceLigneRequest req, int ordre) {
        RetenueSourceLigne ligne = RetenueSourceLigne.builder()
                .numeroFacture(req.getNumeroFacture())
                .montantBrut(req.getMontantBrut())
                .tauxRetenue(req.getTauxRetenue())
                .ordre(req.getOrdre() != null ? req.getOrdre() : ordre)
                .build();
        ligne.calculer();
        return ligne;
    }

    // ── Response ────────────────────────────────────────────────────────────

    public static RetenueSourceResponse toResponse(RetenueSource rs) {
        return RetenueSourceResponse.builder()
                .id(rs.getId())
                .numeroDocument(rs.getNumeroDocument())
                .dateRetenue(rs.getDateRetenue())
                .lieuRetenue(rs.getLieuRetenue())
                .fournisseurId(rs.getFournisseur().getId())
                .fournisseurRaisonSociale(rs.getFournisseur().getRaisonSociale())
                .fournisseurMatricule(rs.getFournisseur().getMatricule())
                .fournisseurAdresse(rs.getFournisseur().getAdresse())
                .lignes(rs.getLignes().stream().map(RetenueSourceMapper::toLigneResponse).toList())
                .totalMontantBrut(rs.getTotalMontantBrut())
                .totalRetenue(rs.getTotalRetenue())
                .totalMontantNet(rs.getTotalMontantNet())
                .dateCreation(rs.getDateCreation())
                .dateModification(rs.getDateModification())
                .build();
    }

    private static RetenueSourceLigneResponse toLigneResponse(RetenueSourceLigne l) {
        return RetenueSourceLigneResponse.builder()
                .id(l.getId())
                .numeroFacture(l.getNumeroFacture())
                .montantBrut(l.getMontantBrut())
                .tauxRetenue(l.getTauxRetenue())
                .montantRetenue(l.getMontantRetenue())
                .montantNet(l.getMontantNet())
                .ordre(l.getOrdre())
                .dateCreation(l.getDateCreation())
                .build();
    }
}
