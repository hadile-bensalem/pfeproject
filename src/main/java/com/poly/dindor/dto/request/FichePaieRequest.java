package com.poly.dindor.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class FichePaieRequest {

    @NotNull
    private Long employeId;

    @NotNull @Min(1) @Max(12)
    private Integer mois;

    @NotNull @Min(2000)
    private Integer annee;

    @NotNull
    private BigDecimal salaireBase;

    private BigDecimal primesFixes;
    private BigDecimal primeRendement;
    private BigDecimal indemnites;

    private Integer heuresSupplementaires;
    private BigDecimal tauxHoraireHS;

    private BigDecimal avanceSalaire;
    private BigDecimal autresRetenues;

    private String statut;
    private LocalDate datePaiement;
    private String notes;
}
