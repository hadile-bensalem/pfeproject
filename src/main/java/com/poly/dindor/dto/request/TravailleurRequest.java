package com.poly.dindor.dto.request;

import com.poly.dindor.entity.Travailleur;
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
public class TravailleurRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 50, message = "Le nom ne doit pas dépasser 50 caractères")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 50, message = "Le prénom ne doit pas dépasser 50 caractères")
    private String prenom;

    @NotBlank(message = "Le CIN est obligatoire")
    @Size(min = 6, max = 12, message = "Le CIN doit contenir entre 6 et 12 caractères")
    @Pattern(regexp = "^[A-Za-z0-9]+$", message = "Le CIN ne doit contenir que des lettres et des chiffres")
    private String cin;

    @Size(max = 255, message = "L'adresse ne doit pas dépasser 255 caractères")
    private String adresse;

    @Size(max = 15, message = "Le téléphone ne doit pas dépasser 15 caractères")
    @Pattern(regexp = "^[0-9+\\s]*$", message = "Le téléphone doit contenir uniquement des chiffres, + et espaces")
    private String telephone;

    private LocalDate dateNaissance;

    @NotNull(message = "La date d'embauche est obligatoire")
    private LocalDate dateEmbauche;

    @NotNull(message = "Le type de travailleur est obligatoire")
    private Travailleur.TypeTravailleur typeTravailleur;

    private Boolean statutCNSS;

    @NotNull(message = "Le tarif journalier est obligatoire")
    @Min(value = 0, message = "Le tarif journalier doit être positif ou nul")
    private Double tarifJournalier;

    @NotNull(message = "Les heures de travail par jour sont obligatoires")
    @Min(value = 1, message = "Les heures de travail doivent être au moins 1")
    @Max(value = 12, message = "Les heures de travail ne doivent pas dépasser 12")
    private Integer heuresTravailJour;

    @NotNull(message = "Le rendement est obligatoire")
    @DecimalMin(value = "0.5", message = "Le rendement doit être au moins 0.5")
    @DecimalMax(value = "2.0", message = "Le rendement ne doit pas dépasser 2.0")
    private Double rendement;

    @Size(max = 1000, message = "Les observations ne doivent pas dépasser 1000 caractères")
    private String observations;

    private Boolean actif;
}
