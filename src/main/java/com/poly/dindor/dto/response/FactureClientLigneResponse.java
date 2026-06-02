package com.poly.dindor.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class FactureClientLigneResponse {
    private Long       id;
    private String     codeArticle;
    private String     designation;
    private String     unite;
    private BigDecimal quantite;
    private BigDecimal prixUnitaireHT;
    private BigDecimal remise;
    private BigDecimal tva;
    private BigDecimal totalHT;
    private BigDecimal montantTVA;
    private BigDecimal montantRemise;
    private BigDecimal prixRevient;
    private Integer    ordre;
}
