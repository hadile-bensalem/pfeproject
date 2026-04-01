package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
@Table(name = "facture_achat_ligne")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactureAchatLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_achat_id", nullable = false)
    private FactureAchat factureAchat;

    @Column(name = "code_article", length = 50)
    private String codeArticle;

    @Column(name = "designation", length = 500, nullable = false)
    private String designation;

    @Column(name = "quantite", precision = 15, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal quantite = BigDecimal.ONE;

    @Column(name = "prix_unitaire_ht", precision = 15, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal prixUnitaireHT = BigDecimal.ZERO;

    @Column(name = "remise", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal remise = BigDecimal.ZERO;

    @Column(name = "prix_remise", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal prixRemise = BigDecimal.ZERO;

    @Column(name = "tva", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal tva = BigDecimal.ZERO;

    @Column(name = "total_ht", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal totalHT = BigDecimal.ZERO;

    @Column(name = "montant_tva", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal montantTVA = BigDecimal.ZERO;

    @Column(name = "total_ttc", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal totalTTC = BigDecimal.ZERO;

    @Column(name = "montant_remise", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal montantRemise = BigDecimal.ZERO;

    @Column(name = "ordre")
    @Builder.Default
    private Integer ordre = 0;

    @PrePersist
    @PreUpdate
    public void calculer() {
        if (prixUnitaireHT == null || remise == null || quantite == null || tva == null) return;
        BigDecimal tauxRemise = remise.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP);
        prixRemise = prixUnitaireHT.multiply(BigDecimal.ONE.subtract(tauxRemise))
            .setScale(3, RoundingMode.HALF_UP);
        montantRemise = prixUnitaireHT.subtract(prixRemise)
            .multiply(quantite).setScale(3, RoundingMode.HALF_UP);
        totalHT = prixRemise.multiply(quantite).setScale(3, RoundingMode.HALF_UP);
        montantTVA = totalHT.multiply(tva.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP))
            .setScale(3, RoundingMode.HALF_UP);
        totalTTC = totalHT.add(montantTVA).setScale(3, RoundingMode.HALF_UP);
    }
}
