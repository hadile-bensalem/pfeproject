package com.poly.dindor.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class VenteStatsResponse {
    private BigDecimal chiffreAffaire;
    private BigDecimal totalQteVendue;
    private long       nombreBons;
    private BigDecimal montantCredit;
    private BigDecimal montantEspeces;

    @Data
    public static class DetailArticle {
        private String     codeArticle;
        private String     libelle;
        private BigDecimal qteSortie;
        private BigDecimal montantHT;
    }

    private BigDecimal benefice;

    private List<DetailArticle> detailArticles;
}
