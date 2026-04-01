package com.poly.dindor.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class FactureAchatLigneResponse {
    private Long id;
    private String codeArticle;
    private String designation;
    private BigDecimal quantite;
    private BigDecimal prixUnitaireHT;
    private BigDecimal remise;
    private BigDecimal prixRemise;
    private BigDecimal tva;
    private BigDecimal totalHT;
    private BigDecimal montantTVA;
    private BigDecimal totalTTC;
    private BigDecimal montantRemise;
    private Integer ordre;
}
