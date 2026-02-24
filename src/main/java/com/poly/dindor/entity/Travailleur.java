package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "travailleurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Travailleur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String nom;

    @Column(nullable = false, length = 50)
    private String prenom;

    @Column(nullable = false, unique = true, length = 12)
    private String cin;

    @Column(length = 255)
    private String adresse;

    @Column(length = 15)
    private String telephone;

    private LocalDate dateNaissance;

    @Column(nullable = false)
    private LocalDate dateEmbauche;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeTravailleur typeTravailleur;

    @Column(nullable = false)
    @Builder.Default
    private Boolean statutCNSS = Boolean.FALSE;

    @Column(nullable = false)
    private Double tarifJournalier;

    @Column(nullable = false)
    private Integer heuresTravailJour;

    @Column(nullable = false)
    private Double rendement;

    @Column(length = 1000)
    private String observations;

    @Column(nullable = false)
    @Builder.Default
    private Boolean actif = Boolean.TRUE;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime dateModification;

    public enum TypeTravailleur {
        PERMANENT,
        SAISONNIER
    }
}
