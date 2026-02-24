package com.poly.dindor.mapper;

import com.poly.dindor.dto.request.TravailleurRequest;
import com.poly.dindor.dto.response.TravailleurResponse;
import com.poly.dindor.entity.Travailleur;

public final class TravailleurMapper {

    private TravailleurMapper() {
    }

    public static Travailleur toEntity(TravailleurRequest request) {
        if (request == null) {
            return null;
        }
        return Travailleur.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .cin(request.getCin())
                .adresse(request.getAdresse())
                .telephone(request.getTelephone())
                .dateNaissance(request.getDateNaissance())
                .dateEmbauche(request.getDateEmbauche())
                .typeTravailleur(request.getTypeTravailleur())
                .statutCNSS(Boolean.TRUE.equals(request.getStatutCNSS()))
                .tarifJournalier(request.getTarifJournalier())
                .heuresTravailJour(request.getHeuresTravailJour())
                .rendement(request.getRendement())
                .observations(request.getObservations())
                .actif(request.getActif() != null ? request.getActif() : true)
                .build();
    }

    public static void updateEntity(Travailleur entity, TravailleurRequest request) {
        if (entity == null || request == null) {
            return;
        }
        entity.setNom(request.getNom());
        entity.setPrenom(request.getPrenom());
        entity.setCin(request.getCin());
        entity.setAdresse(request.getAdresse());
        entity.setTelephone(request.getTelephone());
        entity.setDateNaissance(request.getDateNaissance());
        entity.setDateEmbauche(request.getDateEmbauche());
        entity.setTypeTravailleur(request.getTypeTravailleur());
        if (request.getStatutCNSS() != null) {
            entity.setStatutCNSS(request.getStatutCNSS());
        }
        entity.setTarifJournalier(request.getTarifJournalier());
        entity.setHeuresTravailJour(request.getHeuresTravailJour());
        entity.setRendement(request.getRendement());
        entity.setObservations(request.getObservations());
        if (request.getActif() != null) {
            entity.setActif(request.getActif());
        }
    }

    public static TravailleurResponse toResponse(Travailleur entity) {
        if (entity == null) {
            return null;
        }
        // Calcul du salaire final
        Double salaireFinal = null;
        if (entity.getTarifJournalier() != null && entity.getHeuresTravailJour() != null && entity.getRendement() != null) {
            salaireFinal = entity.getTarifJournalier() * entity.getHeuresTravailJour() * entity.getRendement();
        }

        return TravailleurResponse.builder()
                .id(entity.getId())
                .nom(entity.getNom())
                .prenom(entity.getPrenom())
                .cin(entity.getCin())
                .adresse(entity.getAdresse())
                .telephone(entity.getTelephone())
                .dateNaissance(entity.getDateNaissance())
                .dateEmbauche(entity.getDateEmbauche())
                .typeTravailleur(entity.getTypeTravailleur())
                .statutCNSS(entity.getStatutCNSS())
                .tarifJournalier(entity.getTarifJournalier())
                .heuresTravailJour(entity.getHeuresTravailJour())
                .rendement(entity.getRendement())
                .observations(entity.getObservations())
                .actif(entity.getActif())
                .dateCreation(entity.getDateCreation())
                .dateModification(entity.getDateModification())
                .salaireFinal(salaireFinal)
                .build();
    }
}
