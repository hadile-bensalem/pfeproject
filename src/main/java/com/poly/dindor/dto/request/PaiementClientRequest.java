package com.poly.dindor.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaiementClientRequest {
    @NotNull
    @DecimalMin(value = "0.001", message = "Le montant doit être positif")
    private BigDecimal montant;
    private String datePaiement;
    private String notes;
    private String blNumeros;
    private String modePaiement;  // ESPECE | CHEQUE | TRAITE
    private String numeroPaiement;
    private String echeance;      // ISO date string
    private String banque;
}
