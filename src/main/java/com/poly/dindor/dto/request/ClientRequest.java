package com.poly.dindor.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ClientRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    private String typeClient = "AUTRE"; // ETATIQUE, CLIENT_DIVERS, AUTRE, AMBULANT

    private String responsable;
    private String telephone;
    private String telephone2;
    private String fax;
    private String email;
    private String adresse;
    private String ville;
    private String zone;
    private String matriculeFiscal;
    private String codeTVA;
    private BigDecimal tva;
    private Integer prixVente = 1;
    private BigDecimal plafond;
    private String devise = "DT";
    private String notes;
    private boolean actif = true;
}
