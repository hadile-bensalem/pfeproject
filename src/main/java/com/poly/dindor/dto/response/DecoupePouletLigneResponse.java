package com.poly.dindor.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DecoupePouletLigneResponse {
    private Long       id;
    private String     produit;
    private String     unite;
    private BigDecimal quantite;
    private BigDecimal prixUnitaire;
    private BigDecimal totalValeur;
    private boolean    calcule;
}
