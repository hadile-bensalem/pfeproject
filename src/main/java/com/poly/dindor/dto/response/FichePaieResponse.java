package com.poly.dindor.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class FichePaieResponse {
    private Long id;
    private String numeroBulletin;

    // Employé info
    private Long employeId;
    private String employeNom;
    private String employePrenom;
    private String employeMatricule;
    private String employePoste;
    private String employeDepartement;
    private String employeCIN;
    private String employeNumeroCNSS;
    private String employeRib;
    private String employeTypeContrat;

    // Période
    private Integer mois;
    private Integer annee;
    private String periodeLabel;

    // Éléments de rémunération
    private BigDecimal salaireBase;
    private BigDecimal primesFixes;
    private BigDecimal primeRendement;
    private BigDecimal indemnites;

    // Heures supplémentaires
    private Integer heuresSupplementaires;
    private BigDecimal tauxHoraireHS;
    private BigDecimal montantHS;

    // Brut
    private BigDecimal salaireBrut;

    // CNSS
    private BigDecimal cotisationCNSSEmploye;
    private BigDecimal cotisationCNSSEmployeur;

    // Imposable
    private BigDecimal salaireImposable;

    // Retenues
    private BigDecimal avanceSalaire;
    private BigDecimal autresRetenues;

    // Net
    private BigDecimal salaireNet;

    // Statut
    private String statut;
    private LocalDate datePaiement;
    private String notes;
    private LocalDateTime dateCreation;
}
