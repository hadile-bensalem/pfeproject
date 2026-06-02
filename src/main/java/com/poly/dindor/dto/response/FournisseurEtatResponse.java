package com.poly.dindor.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class FournisseurEtatResponse {
    private Long fournisseurId;
    private String nom;
    private String matricule;
    private BigDecimal solde;
    private BigDecimal traitementEnCours;
}
