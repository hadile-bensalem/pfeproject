package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Certificat de Retenue à la Source (شهادة خصم الضريبة).
 * Représente un certificat officiel tunisien de retenue d'impôt.
 */
@Entity
@Table(name = "retenue_source")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetenueSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Numéro du certificat (ex: RS-2025-001) */
    @Column(name = "numero_document", unique = true, length = 30)
    private String numeroDocument;

    /** Date à laquelle la retenue a été effectuée */
    @Column(name = "date_retenue", nullable = false)
    private LocalDate dateRetenue;

    /** Lieu où la retenue a été effectuée */
    @Column(name = "lieu_retenue", length = 100)
    private String lieuRetenue;

    /** Bénéficiaire (Section C) — le fournisseur qui subit la retenue */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fournisseur_id", nullable = false)
    private Fournisseur fournisseur;

    /** Lignes de factures incluses dans ce certificat */
    @OneToMany(mappedBy = "retenueSource", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<RetenueSourceLigne> lignes = new ArrayList<>();

    /** Total des montants bruts (calculé avant sauvegarde) */
    @Column(name = "total_montant_brut", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal totalMontantBrut = BigDecimal.ZERO;

    /** Total des retenues (calculé avant sauvegarde) */
    @Column(name = "total_retenue", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal totalRetenue = BigDecimal.ZERO;

    /** Total des montants nets (calculé avant sauvegarde) */
    @Column(name = "total_montant_net", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal totalMontantNet = BigDecimal.ZERO;

    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        dateModification = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }

    /** Recalcule les totaux depuis les lignes */
    public void recalculerTotaux() {
        totalMontantBrut = lignes.stream()
                .map(RetenueSourceLigne::getMontantBrut)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        totalRetenue = lignes.stream()
                .map(RetenueSourceLigne::getMontantRetenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        totalMontantNet = lignes.stream()
                .map(RetenueSourceLigne::getMontantNet)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
