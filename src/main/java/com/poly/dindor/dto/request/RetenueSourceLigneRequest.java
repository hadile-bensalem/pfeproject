package com.poly.dindor.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RetenueSourceLigneRequest {

    @NotBlank(message = "Le numéro de facture est obligatoire")
    private String numeroFacture;

    @NotNull(message = "Le montant brut est obligatoire")
    @DecimalMin(value = "0.001", message = "Le montant brut doit être positif")
    private BigDecimal montantBrut;

    @NotNull(message = "Le taux de retenue est obligatoire")
    @DecimalMin(value = "0.001", message = "Le taux doit être positif")
    private BigDecimal tauxRetenue;

    private Integer ordre;
}
