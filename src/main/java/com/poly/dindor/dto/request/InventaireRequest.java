package com.poly.dindor.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class InventaireRequest {

    @NotNull(message = "L'identifiant de l'article est obligatoire")
    private Long articleId;

    @NotNull(message = "La quantité est obligatoire")
    private BigDecimal quantite;

    private BigDecimal prixUnitaire;
}
