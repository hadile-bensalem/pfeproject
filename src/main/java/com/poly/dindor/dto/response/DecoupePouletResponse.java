package com.poly.dindor.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class DecoupePouletResponse {
    private Long       id;
    private String     dateDecoupe;
    private String     numeroLot;
    private BigDecimal qteAchetee;
    private BigDecimal prixUnitaireAchat;
    private BigDecimal totalAchat;
    private String     produitCalcule;
    private String     dateCreation;
    private List<DecoupePouletLigneResponse> lignes;
}
