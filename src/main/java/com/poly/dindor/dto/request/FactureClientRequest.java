package com.poly.dindor.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class FactureClientRequest {

    private String numeroFacture;
    private String typeDocument; // "FACTURE" or "BON_LIVRAISON" — defaults to FACTURE if null

    @NotNull(message = "La date de la facture est obligatoire")
    private String dateFacture;

    private Long   clientId;
    private String clientCode;
    private String clientNom;
    private String clientAdresse;
    private String clientMF;

    @NotEmpty(message = "Au moins une ligne est requise")
    @Valid
    private List<FactureClientLigneRequest> lignes;

    @NotNull @Valid
    private PaiementFactureClientRequest paiement;
}
