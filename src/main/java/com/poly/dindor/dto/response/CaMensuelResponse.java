package com.poly.dindor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CaMensuelResponse {
    private int mois;
    private String libelle;
    private BigDecimal ca;
    private long nbBons;
}
