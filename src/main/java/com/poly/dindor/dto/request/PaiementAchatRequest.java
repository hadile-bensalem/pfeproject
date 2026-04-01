package com.poly.dindor.dto.request;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaiementAchatRequest {

    /** Mode principal : ESPECES ou AUTRE */
    private String modePaiement;

    /** Sous-mode : TOUT_ESPECES, ACOMPTE_TRAITE, ACOMPTE_CREDIT */
    private String sousMode;

    private BigDecimal montantPaye;

    private BigDecimal montantReste;

    /** Pour mode ACOMPTE_TRAITE */
    private LocalDate dateEcheance;
    private String   numeroTraite;

    /** Pour mode ACOMPTE_CREDIT */
    private LocalDate dateLimiteCredit;

    private Boolean avecRetenue = Boolean.FALSE;
}
