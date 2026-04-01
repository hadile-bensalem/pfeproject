package com.poly.dindor.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class FactureAchatRequest {

    /** Optionnel — généré automatiquement si absent */
    private String numeroFacture;

    @NotNull(message = "La date de facture est obligatoire")
    private LocalDate dateFacture;

    @NotNull(message = "Le fournisseur est obligatoire")
    private Long fournisseurId;

    @NotEmpty(message = "Au moins une ligne est requise")
    @Valid
    private List<FactureAchatLigneRequest> lignes;

    @Valid
    private PaiementAchatRequest paiement;
}
