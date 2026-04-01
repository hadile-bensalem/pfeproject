package com.poly.dindor.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class RetenueSourceLigneResponse {
    private Long id;
    private String numeroFacture;
    private BigDecimal montantBrut;
    private BigDecimal tauxRetenue;
    private BigDecimal montantRetenue;
    private BigDecimal montantNet;
    private Integer ordre;
    private LocalDateTime dateCreation;
}
