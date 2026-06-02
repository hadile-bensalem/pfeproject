package com.poly.dindor.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class BonLivraisonRequest {
    private String numeroBL;

    @NotNull(message = "La date du bon de livraison est obligatoire")
    private String dateBL;

    private Long   clientId;
    private String clientCode;
    private String clientNom;
    private String clientAdresse;
    private String clientMF;
    private Long   transporteurId;
    private Long   vehiculeId;
    private String transporteurNom;
    private String vehiculeNumero;

    @NotEmpty(message = "Au moins une ligne est requise")
    @Valid
    private List<BonLivraisonLigneRequest> lignes;

    @NotNull @Valid
    private PaiementVenteRequest paiement;
}
