package com.poly.dindor.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class FactureAchatLigneRequest {

    private String codeArticle;

    @NotBlank(message = "La désignation est obligatoire")
    private String designation;

    @NotNull(message = "La quantité est obligatoire")
    @DecimalMin(value = "0.001", message = "La quantité doit être positive")
    private BigDecimal quantite;

    @NotNull(message = "Le prix unitaire est obligatoire")
    @DecimalMin(value = "0", inclusive = true, message = "Le prix doit être positif ou nul")
    private BigDecimal prixUnitaireHT;

    private BigDecimal remise = BigDecimal.ZERO;

    private BigDecimal tva = BigDecimal.ZERO;

    private Integer ordre;
}
