package com.poly.dindor.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PaiementAchatResponse {
    private String modePaiement;   // ESPECES | AUTRE
    private String sousMode;       // TOUT_ESPECES | ACOMPTE_TRAITE | ACOMPTE_CREDIT
    private BigDecimal montantPaye;
    private BigDecimal montantReste;
    private String dateEcheance;   // ISO string yyyy-MM-dd
    private String numeroTraite;
    private String dateLimiteCredit;
    private Boolean avecRetenue;
}
