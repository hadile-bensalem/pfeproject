package com.poly.dindor.dto.request;

import com.poly.dindor.entity.Employee;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeRequest {

    @NotBlank(message = "Le matricule est obligatoire")
    @Size(max = 50, message = "Le matricule ne doit pas dépasser 50 caractères")
    private String matricule;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 50, message = "Le nom ne doit pas dépasser 50 caractères")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 50, message = "Le prénom ne doit pas dépasser 50 caractères")
    private String prenom;

    @NotBlank(message = "Le CIN est obligatoire")
    @Size(min = 6, max = 12, message = "Le CIN doit contenir entre 6 et 12 caractères")
    private String cin;

    @Size(max = 15, message = "Le téléphone ne doit pas dépasser 15 caractères")
    private String telephone;

    @Email(message = "L'email doit être valide")
    @Size(max = 150, message = "L'email ne doit pas dépasser 150 caractères")
    private String email;

    @Size(max = 255, message = "L'adresse ne doit pas dépasser 255 caractères")
    private String adresse;

    private LocalDate dateNaissance;

    @Size(max = 50, message = "La situation familiale ne doit pas dépasser 50 caractères")
    private String situationFamiliale;

    @Min(value = 0, message = "Le nombre d'enfants doit être positif ou nul")
    private Integer nombreEnfants;

    @Size(max = 100, message = "Le poste ne doit pas dépasser 100 caractères")
    private String poste;

    @NotNull(message = "Le département est obligatoire")
    private Employee.Department departement;

    @NotNull(message = "Le type de contrat est obligatoire")
    private Employee.ContractType typeContrat;

    @NotNull(message = "La date de recrutement est obligatoire")
    private LocalDate dateRecrutement;

    @NotNull(message = "Le statut est obligatoire")
    private Employee.EmployeeStatus statut;

    // Rémunération mensuelle
    @Min(value = 0, message = "Le salaire de base doit être positif ou nul")
    private Double salaireBase;

    @Min(value = 0, message = "Les primes fixes doivent être positives ou nulles")
    private Double primesFixes;

    @Min(value = 0, message = "La prime de rendement doit être positive ou nulle")
    private Double primeRendement;

    // Rémunération journalière
    @Min(value = 0, message = "Le tarif journalier doit être positif ou nul")
    private Double tarifJournalier;

    @Min(value = 0, message = "Le nombre de jours de travail doit être positif ou nul")
    private Integer joursTravail;

    // Rémunération horaire
    @Min(value = 0, message = "Le tarif horaire doit être positif ou nul")
    private Double tarifHoraire;

    @Min(value = 0, message = "Les heures normales doivent être positives ou nulles")
    private Integer heuresNormales;

    @Min(value = 0, message = "Les heures supplémentaires doivent être positives ou nulles")
    private Integer heuresSupplementaires;

    private Boolean actif;
}
