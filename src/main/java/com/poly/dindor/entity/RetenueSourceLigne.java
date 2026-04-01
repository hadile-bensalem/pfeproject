package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

/**
 * Une ligne de facture dans un certificat de retenue à la source.
 * Correspond à une facture d'achat sur laquelle la retenue a été calculée.
 */
@Entity
@Table(name = "retenue_source_ligne")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetenueSourceLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Certificat parent */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retenue_source_id", nullable = false)
    private RetenueSource retenueSource;

    /** Numéro de la facture concernée */
    @Column(name = "numero_facture", nullable = false, length = 50)
    private String numeroFacture;

    /** Montant brut de la facture (HT) */
    @Column(name = "montant_brut", nullable = false, precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal montantBrut = BigDecimal.ZERO;

    /** Taux de retenue en % (ex: 3.000, 5.000, 15.000) */
    @Column(name = "taux_retenue", nullable = false, precision = 5, scale = 3)
    @Builder.Default
    private BigDecimal tauxRetenue = BigDecimal.ZERO;

    /** Montant de la retenue = montantBrut × tauxRetenue / 100 */
    @Column(name = "montant_retenue", nullable = false, precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal montantRetenue = BigDecimal.ZERO;

    /** Montant net = montantBrut − montantRetenue */
    @Column(name = "montant_net", nullable = false, precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal montantNet = BigDecimal.ZERO;

    /** Ordre d'affichage dans le certificat */
    @Column(name = "ordre")
    @Builder.Default
    private Integer ordre = 0;

    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        calculer();
    }

    @PreUpdate
    protected void onUpdate() {
        calculer();
    }

    /** Recalcule montantRetenue et montantNet depuis montantBrut et tauxRetenue */
    public void calculer() {
        if (montantBrut != null && tauxRetenue != null) {
            montantRetenue = montantBrut
                    .multiply(tauxRetenue)
                    .divide(BigDecimal.valueOf(100), 3, RoundingMode.HALF_UP);
            montantNet = montantBrut.subtract(montantRetenue).setScale(3, RoundingMode.HALF_UP);
        }
    }
}
