package com.poly.dindor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopClientResponse {
    private String nom;
    private BigDecimal ca;
    private long nbBons;
}
