package com.poly.dindor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RapportPeriodeRow {
    private String     date;
    private String     numeroBL;
    private String     designation;
    private BigDecimal quantite;
    private BigDecimal prixUnitaireHT;
    private BigDecimal totalHT;
}
