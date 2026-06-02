package com.poly.dindor.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BonLivraisonLigneRequest {

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

    private BigDecimal remise = BigDecimal.ZERO;
    private BigDecimal tva    = BigDecimal.ZERO;
    private Integer    ordre  = 1;
}
