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
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String matricule;

    @Column(nullable = false, length = 50)
    private String nom;

    @Column(nullable = false, length = 50)
    private String prenom;

    @Column(nullable = false, unique = true, length = 12)
    private String cin;

    @Column(length = 15)
    private String telephone;

    @Column(length = 150)
    private String email;

    @Column(length = 255)
    private String adresse;

    private LocalDate dateNaissance;

    @Column(length = 50)
    private String situationFamiliale;

    @Column(nullable = false)
    @Builder.Default
    private Integer nombreEnfants = 0;

    @Column(length = 100)
    private String poste;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Department departement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContractType typeContrat;

    @Column(nullable = false)
    private LocalDate dateRecrutement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmployeeStatus statut;

    // Rémunération mensuelle
    private Double salaireBase;
    private Double primesFixes;
    private Double primeRendement;

    // Rémunération journalière
    private Double tarifJournalier;
    private Integer joursTravail;

    // Rémunération horaire
    private Double tarifHoraire;
    private Integer heuresNormales;
    private Integer heuresSupplementaires;

    @Column(nullable = false)
    @Builder.Default
    private Boolean actif = Boolean.TRUE;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime dateModification;

    public enum Department {
        VENTE,
        STOCK,
        LIVRAISON
    }

    public enum ContractType {
        CDI,
        CDD,
        JOURNALIER,
        HORAIRE
    }

    public enum EmployeeStatus {
        ACTIF,
        SUSPENDU,
        QUITTÉ
    }
}
