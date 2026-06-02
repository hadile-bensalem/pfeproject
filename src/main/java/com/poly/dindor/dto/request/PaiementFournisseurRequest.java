package com.poly.dindor.dto.request;

import com.poly.dindor.entity.PaiementFournisseur;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaiementFournisseurRequest {

    @NotNull
    @DecimalMin("0.001")
    private BigDecimal montant;

    @NotNull
    private LocalDate datePaiement;

    @NotNull
    private PaiementFournisseur.ModePaiement modePaiement;

    private String numeroPaiement;
    private LocalDate echeance;
    private String banque;
    private String remarque;
    private String numeroFacture;
}
