package com.poly.dindor.mapper;

import com.poly.dindor.dto.request.FournisseurRequest;
import com.poly.dindor.dto.response.FournisseurResponse;
import com.poly.dindor.entity.Fournisseur;

public final class FournisseurMapper {

    private FournisseurMapper() {
    }

    public static Fournisseur toEntity(FournisseurRequest request) {
        if (request == null) {
            return null;
        }
        return Fournisseur.builder()
                .matricule(request.getMatricule())
                .raisonSociale(request.getRaisonSociale())
                .adresse(request.getAdresse())
                .codeTVA(request.getCodeTVA())
                .telephone1(request.getTelephone1())
                .telephone2(request.getTelephone2())
                .email(request.getEmail())
                .responsableContact(request.getResponsableContact())
                .devise(request.getDevise())
                .observations(request.getObservations())
                .avecRS(Boolean.TRUE.equals(request.getAvecRS()))
                .build();
    }

    public static void updateEntity(Fournisseur entity, FournisseurRequest request) {
        if (entity == null || request == null) {
            return;
        }
        entity.setMatricule(request.getMatricule());
        entity.setRaisonSociale(request.getRaisonSociale());
        entity.setAdresse(request.getAdresse());
        entity.setCodeTVA(request.getCodeTVA());
        entity.setTelephone1(request.getTelephone1());
        entity.setTelephone2(request.getTelephone2());
        entity.setEmail(request.getEmail());
        entity.setResponsableContact(request.getResponsableContact());
        entity.setDevise(request.getDevise());
        entity.setObservations(request.getObservations());
        entity.setAvecRS(Boolean.TRUE.equals(request.getAvecRS()));
    }

    public static FournisseurResponse toResponse(Fournisseur entity) {
        if (entity == null) {
            return null;
        }
        return FournisseurResponse.builder()
                .id(entity.getId())
                .matricule(entity.getMatricule())
                .raisonSociale(entity.getRaisonSociale())
                .adresse(entity.getAdresse())
                .codeTVA(entity.getCodeTVA())
                .telephone1(entity.getTelephone1())
                .telephone2(entity.getTelephone2())
                .email(entity.getEmail())
                .responsableContact(entity.getResponsableContact())
                .devise(entity.getDevise())
                .observations(entity.getObservations())
                .avecRS(entity.getAvecRS())
                .dateCreation(entity.getDateCreation())
                .dateModification(entity.getDateModification())
                .build();
    }
}

