package com.poly.dindor.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class RetenueSourceResponse {
    private Long id;
    private String numeroDocument;
    private LocalDate dateRetenue;
    private String lieuRetenue;

    // Bénéficiaire
    private Long fournisseurId;
    private String fournisseurRaisonSociale;
    private String fournisseurMatricule;
    private String fournisseurAdresse;

    // Lignes
    private List<RetenueSourceLigneResponse> lignes;

    // Totaux
    private BigDecimal totalMontantBrut;
    private BigDecimal totalRetenue;
    private BigDecimal totalMontantNet;

    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
}
