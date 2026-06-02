package com.poly.dindor.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaiementClientResponse {
    private Long       id;
    private Long       clientId;
    private String     clientNom;
    private BigDecimal montant;
    private String     datePaiement;
    private String     notes;
    private String     blNumeros;
    private String     modePaiement;
    private String     numeroPaiement;
    private String     echeance;
    private String     banque;
    private String     dateCreation;
}
