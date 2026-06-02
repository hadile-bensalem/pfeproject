package com.poly.dindor.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class StockArticleResponse {
    private Long id;
    private String codeArticle;
    private String designation;
    private String famille;
    private String unite;

    /** Stock physique confirmé (achats validés). */
    private BigDecimal stock;

    /** Quantité réservée pour des commandes en cours. */
    private BigDecimal stockReserve;

    /** Quantité attendue (achats en brouillon, non encore validés). */
    private BigDecimal stockEnAttente;

    /** stock - stockReserve : ce qu'on peut vendre immédiatement. */
    private BigDecimal disponibleReel;

    /** stock + stockEnAttente - stockReserve : ce qu'on pourra vendre après validation achat. */
    private BigDecimal disponiblePrevu;

    private BigDecimal stockMinimum;
    private BigDecimal pump;
    private BigDecimal valeurStock;
    private boolean enAlerte;
    private boolean enRupture;
    private boolean estDerive;
    private String codeArticleSource;
}
