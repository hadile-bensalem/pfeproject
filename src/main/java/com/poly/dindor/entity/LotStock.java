package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "lot_stock", indexes = {
    @Index(name = "idx_lot_origine_actif", columnList = "article_origine_id, actif, date_entree"),
    @Index(name = "idx_lot_derive_actif",  columnList = "article_derive_id, actif, date_entree")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LotStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_achat_id", nullable = false)
    private FactureAchat factureAchat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fournisseur_id", nullable = false)
    private Fournisseur fournisseur;

    /** Article acheté (matière première ou article standard). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_origine_id", nullable = false)
    private Article articleOrigine;

    /** Premier article dérivé lié à ce lot (nullable si achat sans transformation). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_derive_id")
    private Article articleDerive;

    @Column(name = "date_entree", nullable = false)
    private LocalDate dateEntree;

    @Column(name = "prix_unitaire", precision = 15, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal prixUnitaire = BigDecimal.ZERO;

    @Column(name = "qte_origine_initiale", precision = 15, scale = 3, nullable = false)
    private BigDecimal qteOrigineInitiale;

    /** Diminue à chaque vente (source directe ou consommation pour dérivé). */
    @Column(name = "qte_origine_restante", precision = 15, scale = 3, nullable = false)
    private BigDecimal qteOrigineRestante;

    /** Taux de transformation de ce lot (ex : 0.7400 = 74 %). NULL si lot sans dérivé. */
    @Column(name = "taux_conversion", precision = 5, scale = 4)
    private BigDecimal tauxConversion;

    /** qte_origine_initiale × taux_conversion. NULL si pas de dérivé. */
    @Column(name = "qte_derive_initiale", precision = 15, scale = 3)
    private BigDecimal qteDeriveInitiale;

    /** Diminue à chaque vente du produit dérivé. */
    @Column(name = "qte_derive_restante", precision = 15, scale = 3)
    private BigDecimal qteDeriveRestante;

    /** Date de péremption de ce lot (alerte J-3, inactif à J). */
    @Column(name = "date_peremption")
    private LocalDate datePeremption;

    /** Passe à false quand qte_origine_restante atteint zéro. */
    @Column(name = "actif", nullable = false)
    @Builder.Default
    private Boolean actif = Boolean.TRUE;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;
}
