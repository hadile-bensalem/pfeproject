package com.poly.dindor.dto.response;

import com.poly.dindor.entity.Travailleur;
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
public class TravailleurResponse {

    private Long id;
    private String nom;
    private String prenom;
    private String cin;
    private String adresse;
    private String telephone;
    private LocalDate dateNaissance;
    private LocalDate dateEmbauche;
    private Travailleur.TypeTravailleur typeTravailleur;
    private Boolean statutCNSS;
    private Double tarifJournalier;
    private Integer heuresTravailJour;
    private Double rendement;
    private String observations;
    private Boolean actif;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
    private Double salaireFinal;
}
