package com.poly.dindor.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class FactureAchatResponse {
    private Long id;
    private String numeroFacture;
    private LocalDate dateFacture;
    private Long fournisseurId;
    private String fournisseurRaisonSociale;
    private String fournisseurMatricule;
    private List<FactureAchatLigneResponse> lignes;
    private BigDecimal totalBrut;
    private BigDecimal totalRemise;
    private BigDecimal totalHT;
    private BigDecimal totalTVA;
    private BigDecimal timbreFiscal;
    private BigDecimal netAPayer;
    private String statut;
    private LocalDateTime dateCreation;
}
