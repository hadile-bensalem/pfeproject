package com.poly.dindor.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TransactionFournisseurResponse {
    private Long id;
    /** Non-null uniquement pour les PaiementFournisseur (règlements supplémentaires supprimables) */
    private Long paiementFournisseurId;
    private String type;          // "Achat" | "TRAITE" | "Espèces" | "Crédit" | "Règlement"
    private String numeroFacture;
    private String date;
    private BigDecimal debit;
    private BigDecimal credit;
    private BigDecimal soldeCumule;
    private String modePaiement;
    private String numeroTraite;
    private String echeance;
    private BigDecimal espece;
}
