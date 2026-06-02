package com.poly.dindor.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class DecoupePouletRequest {

    @NotNull(message = "La date de découpe est obligatoire")
    private String dateDecoupe;

    private String numeroLot;

    @NotNull
    @DecimalMin(value = "0.001", message = "La quantité achetée doit être > 0")
    private BigDecimal qteAchetee;

    @NotNull
    @DecimalMin(value = "0.001", message = "Le prix unitaire doit être > 0")
    private BigDecimal prixUnitaireAchat;

    @NotBlank(message = "Le produit calculé est obligatoire")
    private String produitCalcule;

    @NotEmpty(message = "Les lignes de découpe sont obligatoires")
    @Valid
    private List<DecoupePouletLigneRequest> lignes;
}
