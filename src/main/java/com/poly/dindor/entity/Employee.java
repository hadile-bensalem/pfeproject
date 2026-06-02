package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "matricule", unique = true, length = 20)
    private String matricule;

    @Column(name = "cin", length = 20)
    private String cin;

    @Column(name = "nom", nullable = false, length = 100)
    private String nom;

    @Column(name = "prenom", nullable = false, length = 100)
    private String prenom;

    @Column(name = "telephone", length = 20)
    private String telephone;

    @Column(name = "email", unique = true, length = 100)
    private String email;

    @Column(name = "mot_de_passe", length = 255)
    private String motDePasse;

    @Column(name = "adresse", columnDefinition = "TEXT")
    private String adresse;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @Column(name = "situation_familiale", length = 20)
    @Builder.Default
    private String situationFamiliale = "CELIBATAIRE";

    @Column(name = "nombre_enfants")
    @Builder.Default
    private Integer nombreEnfants = 0;

    @Column(name = "poste", length = 100)
    private String poste;

    @Column(name = "departement", length = 50)
    private String departement;

    @Column(name = "type_contrat", length = 20)
    @Builder.Default
    private String typeContrat = "CDI";

    @Column(name = "date_recrutement")
    private LocalDate dateRecrutement;

    @Column(name = "statut", length = 20)
    @Builder.Default
    private String statut = "ACTIF";

    @Column(name = "actif")
    @Builder.Default
    private Boolean actif = true;

    @Column(name = "salaire_base", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal salaireBase = BigDecimal.ZERO;

    @Column(name = "primes_fixes", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal primesFixes = BigDecimal.ZERO;

    @Column(name = "prime_rendement", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal primeRendement = BigDecimal.ZERO;

    @Column(name = "tarif_horaire", precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal tarifHoraire = BigDecimal.ZERO;

    @Column(name = "heures_normales_mois")
    @Builder.Default
    private Integer heuresNormalesMois = 208;

    @Column(name = "affilie_cnss")
    @Builder.Default
    private Boolean affilieCnss = true;

    @Column(name = "numero_cnss", length = 20)
    private String numeroCNSS;

    @Column(name = "rib", length = 30)
    private String rib;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    public Boolean getAffileCnss() { return affilieCnss; }
    public void setAffileCnss(Boolean v) { this.affilieCnss = v; }
}
