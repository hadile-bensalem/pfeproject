package com.poly.dindor.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LotStockResponse {
    private Long id;
    private String numeroFacture;
    private String fournisseurNom;
    private String fournisseurMatricule;
    private LocalDate dateEntree;
    private BigDecimal prixUnitaire;
    private BigDecimal qteOrigineInitiale;
    private BigDecimal qteOrigineRestante;
    private BigDecimal tauxConversion;
    private BigDecimal qteDeriveInitiale;
    private BigDecimal qteDeriveRestante;
    private boolean actif;
    private String articleOrigineCode;
    private String articleOrigineDesignation;
    private String articleDeriveCode;
    private String articleDeriveDesignation;
}
