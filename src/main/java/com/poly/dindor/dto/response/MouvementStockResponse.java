package com.poly.dindor.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class MouvementStockResponse {
    private Long id;
    private String codeArticle;
    private String designation;
    private String typeMouvement;
    private BigDecimal quantite;
    private BigDecimal prixUnitaire;
    private BigDecimal pumpApres;
    private BigDecimal stockAvant;
    private BigDecimal stockApres;
    private String referenceDocument;
    private String notes;
    private String dateOperation;
}
