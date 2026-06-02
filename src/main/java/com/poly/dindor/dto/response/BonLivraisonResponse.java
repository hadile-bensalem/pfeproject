package com.poly.dindor.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class BonLivraisonResponse {
    private Long       id;
    private String     numeroBL;
    private String     dateBL;

    private Long       clientId;
    private String     clientCode;
    private String     clientNom;
    private String     clientAdresse;
    private String     clientMF;

    private Long       transporteurId;
    private Long       vehiculeId;
    private String     transporteurNom;
    private String     vehiculeNumero;
    private BigDecimal soldeSurBL;

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

    private List<BonLivraisonLigneResponse> lignes;
}
