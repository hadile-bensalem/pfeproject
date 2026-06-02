package com.poly.dindor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecouvrementStatsResponse {
    private long total;
    private long payes;
    private long partiels;
    private long enAttente;
    private BigDecimal montantTotal;
    private BigDecimal montantRecouvre;
    private double tauxRecouvrement;
}
