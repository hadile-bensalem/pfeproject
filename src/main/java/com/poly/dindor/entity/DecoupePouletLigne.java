package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "decoupe_poulet_ligne")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DecoupePouletLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decoupe_id", nullable = false)
    private DecoupePoulet decoupe;

    @Column(name = "produit", length = 20, nullable = false)
    private String produit;

    @Column(name = "unite", length = 10, nullable = false)
    private String unite;

    @Column(name = "quantite", precision = 15, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal quantite = BigDecimal.ZERO;

    @Column(name = "prix_unitaire", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal prixUnitaire = BigDecimal.ZERO;

    @Column(name = "total_valeur", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal totalValeur = BigDecimal.ZERO;

    @Column(name = "is_calcule", nullable = false)
    @Builder.Default
    private boolean calcule = false;
}
