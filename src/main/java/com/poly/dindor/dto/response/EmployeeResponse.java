package com.poly.dindor.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class EmployeeResponse {
    private Long id;
    private String matricule;
    private String cin;
    private String nom;
    private String prenom;
    private String nomComplet;
    private String telephone;
    private String email;
    private String adresse;
    private LocalDate dateNaissance;
    private String situationFamiliale;
    private Integer nombreEnfants;
    private String poste;
    private String departement;
    private String typeContrat;
    private LocalDate dateRecrutement;
    private String statut;
    private Boolean actif;
    private BigDecimal salaireBase;
    private BigDecimal primesFixes;
    private BigDecimal primeRendement;
    private BigDecimal tarifHoraire;
    private Integer heuresNormalesMois;
    private Boolean affilieCNSS;
    private String numeroCNSS;
    private String rib;
    private String notes;
    private LocalDateTime dateCreation;
}
