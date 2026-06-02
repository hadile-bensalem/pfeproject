package com.poly.dindor.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class FactureClientLigneRequest {

    private String codeArticle;

    @NotBlank(message = "La désignation est obligatoire")
    private String designation;

    private String unite;

    @NotNull
    @DecimalMin(value = "0.001", message = "La quantité doit être supérieure à 0")
    private BigDecimal quantite;

    @NotNull
    @DecimalMin(value = "0", inclusive = true, message = "Le prix doit être positif")
    private BigDecimal prixUnitaireHT;

    @DecimalMin(value = "0", inclusive = true, message = "La remise doit être comprise entre 0 et 100")
    @DecimalMax(value = "100", message = "La remise ne peut pas dépasser 100%")
    private BigDecimal remise = BigDecimal.ZERO;

    @DecimalMin(value = "0", inclusive = true, message = "La TVA doit être 0, 6 ou 19")
    @DecimalMax(value = "100", message = "La TVA doit être 0, 6 ou 19")
    private BigDecimal tva    = BigDecimal.ZERO;
    private Integer    ordre  = 1;
}
