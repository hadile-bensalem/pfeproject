package com.poly.dindor.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TraiteAlertDTO {
    private Long      factureId;
    private String    numeroFacture;
    private String    numeroTraite;
    private String    fournisseur;
    private BigDecimal montant;
    private String    dateEcheance;
    private int       joursRestants;
}
