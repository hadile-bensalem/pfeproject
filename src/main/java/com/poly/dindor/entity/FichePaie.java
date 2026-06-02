package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fiches_paie",
    uniqueConstraints = @UniqueConstraint(columnNames = {"employe_id", "mois", "annee"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FichePaie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_bulletin", unique = true, length = 30)
    private String numeroBulletin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    private Employee employe;

    @Column(name = "mois", nullable = false)
    private Integer mois;

    @Column(name = "annee", nullable = false)
    private Integer annee;

    // ── Éléments de salaire ───────────────────────────────────────────────
    @Column(name = "salaire_base", precision = 12, scale = 3, nullable = false)
    private BigDecimal salaireBase;

    @Column(name = "primes_fixes", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal primesFixes = BigDecimal.ZERO;

    @Column(name = "prime_rendement", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal primeRendement = BigDecimal.ZERO;

    @Column(name = "indemnites", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal indemnites = BigDecimal.ZERO;

    // ── Heures supplémentaires ────────────────────────────────────────────
    @Column(name = "heures_supplementaires")
    @Builder.Default
    private Integer heuresSupplementaires = 0;

    @Column(name = "taux_horaire_hs", precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal tauxHoraireHS = BigDecimal.ZERO;

    @Column(name = "montant_hs", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal montantHS = BigDecimal.ZERO;

    // ── Totaux bruts ──────────────────────────────────────────────────────
    @Column(name = "salaire_brut", precision = 12, scale = 3)
    private BigDecimal salaireBrut;

    // ── CNSS (cotisations Tunisie 2024) ───────────────────────────────────
    // Salarié : 9.18%  |  Employeur : 16.57%
    @Column(name = "cotisation_cnss_employe", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal cotisationCNSSEmploye = BigDecimal.ZERO;

    @Column(name = "cotisation_cnss_employeur", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal cotisationCNSSEmployeur = BigDecimal.ZERO;

    // ── Salaire imposable ─────────────────────────────────────────────────
    @Column(name = "salaire_imposable", precision = 12, scale = 3)
    private BigDecimal salaireImposable;

    // ── Retenues ──────────────────────────────────────────────────────────
    @Column(name = "avance_salaire", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal avanceSalaire = BigDecimal.ZERO;

    @Column(name = "autres_retenues", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal autresRetenues = BigDecimal.ZERO;

    // ── Net à payer ───────────────────────────────────────────────────────
    @Column(name = "salaire_net", precision = 12, scale = 3)
    private BigDecimal salaireNet;

    // ── Statut ────────────────────────────────────────────────────────────
    @Column(name = "statut", length = 20)
    @Builder.Default
    private String statut = "BROUILLON";

    @Column(name = "date_paiement")
    private LocalDate datePaiement;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;
}
