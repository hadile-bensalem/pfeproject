package com.poly.dindor.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AjustementStockRequest {

    @NotNull(message = "L'identifiant de l'article est obligatoire")
    private Long articleId;

    @NotNull(message = "La quantité est obligatoire")
    private BigDecimal quantite;

    private String notes;

    private String referenceDocument;
}
