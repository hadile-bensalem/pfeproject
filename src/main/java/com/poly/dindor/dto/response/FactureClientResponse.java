package com.poly.dindor.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class FactureClientResponse {
    private Long       id;
    private String     numeroFacture;
    private String     typeDocument;
    private String     dateFacture;

    private Long       clientId;
    private String     clientCode;
    private String     clientNom;
    private String     clientAdresse;
    private String     clientMF;

    private BigDecimal soldeSurFacture;

    private BigDecimal totalBrut;
    private BigDecimal totalRemise;
    private BigDecimal totalHT;
    private BigDecimal totalTVA;
    private BigDecimal timbreFiscal;
    private BigDecimal netAPayer;
    private String     montantEnLettres;

    private String     etatPaiement;
    private String     modePaiement;
    private BigDecimal montantPaye;
    private BigDecimal montantReste;
    private String     dateLimiteCredit;

    private BigDecimal benefice;

    private List<FactureClientLigneResponse> lignes;
}
