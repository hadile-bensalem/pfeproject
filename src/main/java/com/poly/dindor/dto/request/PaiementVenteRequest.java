package com.poly.dindor.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaiementVenteRequest {

    @NotBlank(message = "Le mode de paiement est obligatoire")
    private String modePaiement;   // ESPECES | CREDIT

    private BigDecimal montantPaye  = BigDecimal.ZERO;
    private BigDecimal montantReste = BigDecimal.ZERO;
    private String     dateLimiteCredit;
}
