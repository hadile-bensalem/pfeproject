package com.poly.dindor.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ClientResponse {
    private Long       id;
    private String     codeClient;
    private String     typeClient;
    private String     nom;
    private String     responsable;
    private String     telephone;
    private String     telephone2;
    private String     fax;
    private String     email;
    private String     adresse;
    private String     ville;
    private String     zone;
    private String     matriculeFiscal;
    private String     codeTVA;
    private BigDecimal tva;
    private Integer    prixVente;
    private BigDecimal plafond;
    private String     devise;
    private String     dateInscription;
    private String     notes;
    private boolean    actif;
    private BigDecimal soldeTotalDu;
}
