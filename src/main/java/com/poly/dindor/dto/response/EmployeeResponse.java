package com.poly.dindor.dto.response;

import com.poly.dindor.entity.Employee;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponse {

    private Long id;
    private String matricule;
    private String nom;
    private String prenom;
    private String cin;
    private String telephone;
    private String email;
    private String adresse;
    private LocalDate dateNaissance;
    private String situationFamiliale;
    private Integer nombreEnfants;
    private String poste;
    private Employee.Department departement;
    private Employee.ContractType typeContrat;
    private LocalDate dateRecrutement;
    private Employee.EmployeeStatus statut;
    private Double salaireBase;
    private Double primesFixes;
    private Double primeRendement;
    private Double tarifJournalier;
    private Integer joursTravail;
    private Double tarifHoraire;
    private Integer heuresNormales;
    private Integer heuresSupplementaires;
    private Boolean actif;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
}
