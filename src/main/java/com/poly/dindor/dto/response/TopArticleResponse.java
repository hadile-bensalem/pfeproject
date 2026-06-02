package com.poly.dindor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopArticleResponse {
    private String designation;
    private BigDecimal qty;
    private BigDecimal ca;
}
