package com.poly.dindor.mapper;

import com.poly.dindor.dto.request.EmployeeRequest;
import com.poly.dindor.dto.response.EmployeeResponse;
import com.poly.dindor.entity.Employee;

public final class EmployeeMapper {

    private EmployeeMapper() {
    }

    public static Employee toEntity(EmployeeRequest request) {
        if (request == null) {
            return null;
        }
        return Employee.builder()
                .matricule(request.getMatricule())
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .cin(request.getCin())
                .telephone(request.getTelephone())
                .email(request.getEmail())
                .adresse(request.getAdresse())
                .dateNaissance(request.getDateNaissance())
                .situationFamiliale(request.getSituationFamiliale())
                .nombreEnfants(request.getNombreEnfants() != null ? request.getNombreEnfants() : 0)
                .poste(request.getPoste())
                .departement(request.getDepartement())
                .typeContrat(request.getTypeContrat())
                .dateRecrutement(request.getDateRecrutement())
                .statut(request.getStatut())
                .salaireBase(request.getSalaireBase())
                .primesFixes(request.getPrimesFixes())
                .primeRendement(request.getPrimeRendement())
                .tarifJournalier(request.getTarifJournalier())
                .joursTravail(request.getJoursTravail())
                .tarifHoraire(request.getTarifHoraire())
                .heuresNormales(request.getHeuresNormales())
                .heuresSupplementaires(request.getHeuresSupplementaires())
                .actif(request.getActif() != null ? request.getActif() : true)
                .build();
    }

    public static void updateEntity(Employee entity, EmployeeRequest request) {
        if (entity == null || request == null) {
            return;
        }
        entity.setMatricule(request.getMatricule());
        entity.setNom(request.getNom());
        entity.setPrenom(request.getPrenom());
        entity.setCin(request.getCin());
        entity.setTelephone(request.getTelephone());
        entity.setEmail(request.getEmail());
        entity.setAdresse(request.getAdresse());
        entity.setDateNaissance(request.getDateNaissance());
        entity.setSituationFamiliale(request.getSituationFamiliale());
        if (request.getNombreEnfants() != null) {
            entity.setNombreEnfants(request.getNombreEnfants());
        }
        entity.setPoste(request.getPoste());
        entity.setDepartement(request.getDepartement());
        entity.setTypeContrat(request.getTypeContrat());
        entity.setDateRecrutement(request.getDateRecrutement());
        entity.setStatut(request.getStatut());
        entity.setSalaireBase(request.getSalaireBase());
        entity.setPrimesFixes(request.getPrimesFixes());
        entity.setPrimeRendement(request.getPrimeRendement());
        entity.setTarifJournalier(request.getTarifJournalier());
        entity.setJoursTravail(request.getJoursTravail());
        entity.setTarifHoraire(request.getTarifHoraire());
        entity.setHeuresNormales(request.getHeuresNormales());
        entity.setHeuresSupplementaires(request.getHeuresSupplementaires());
        if (request.getActif() != null) {
            entity.setActif(request.getActif());
        }
    }

    public static EmployeeResponse toResponse(Employee entity) {
        if (entity == null) {
            return null;
        }
        return EmployeeResponse.builder()
                .id(entity.getId())
                .matricule(entity.getMatricule())
                .nom(entity.getNom())
                .prenom(entity.getPrenom())
                .cin(entity.getCin())
                .telephone(entity.getTelephone())
                .email(entity.getEmail())
                .adresse(entity.getAdresse())
                .dateNaissance(entity.getDateNaissance())
                .situationFamiliale(entity.getSituationFamiliale())
                .nombreEnfants(entity.getNombreEnfants())
                .poste(entity.getPoste())
                .departement(entity.getDepartement())
                .typeContrat(entity.getTypeContrat())
                .dateRecrutement(entity.getDateRecrutement())
                .statut(entity.getStatut())
                .salaireBase(entity.getSalaireBase())
                .primesFixes(entity.getPrimesFixes())
                .primeRendement(entity.getPrimeRendement())
                .tarifJournalier(entity.getTarifJournalier())
                .joursTravail(entity.getJoursTravail())
                .tarifHoraire(entity.getTarifHoraire())
                .heuresNormales(entity.getHeuresNormales())
                .heuresSupplementaires(entity.getHeuresSupplementaires())
                .actif(entity.getActif())
                .dateCreation(entity.getDateCreation())
                .dateModification(entity.getDateModification())
                .build();
    }
}
