package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "historique_taux")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueTaux {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_stock_id")
    private LotStock lotStock;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "article_origine_id", nullable = false)
    private Article articleOrigine;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "article_derive_id", nullable = false)
    private Article articleDerive;

    @Column(name = "taux_conversion", nullable = false, precision = 5, scale = 4)
    private BigDecimal tauxConversion;

    @Column(name = "qte_origine", nullable = false, precision = 10, scale = 3)
    private BigDecimal qteOrigine;

    @Column(name = "qte_derivee", nullable = false, precision = 10, scale = 3)
    private BigDecimal qteDeriv;

    @Column(name = "date_fabrication", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dateFabrication = LocalDateTime.now();
}
