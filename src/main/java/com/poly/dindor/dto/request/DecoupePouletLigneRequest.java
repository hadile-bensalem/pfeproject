package com.poly.dindor.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DecoupePouletLigneRequest {

    @NotBlank
    private String produit;

    @NotBlank
    private String unite;

    @NotNull
    @DecimalMin(value = "0", inclusive = true)
    private BigDecimal quantite;

    @NotNull
    private BigDecimal prixUnitaire;

    @NotNull
    private BigDecimal totalValeur;

    private boolean calcule;
}
