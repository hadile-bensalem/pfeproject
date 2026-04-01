package com.poly.dindor.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class RetenueSourceRequest {

    /** Numéro du certificat (optionnel — généré auto si absent) */
    private String numeroDocument;

    @NotNull(message = "La date de retenue est obligatoire")
    private LocalDate dateRetenue;

    private String lieuRetenue;

    @NotNull(message = "Le fournisseur est obligatoire")
    private Long fournisseurId;

    @NotEmpty(message = "Au moins une ligne est requise")
    @Valid
    private List<RetenueSourceLigneRequest> lignes;
}
