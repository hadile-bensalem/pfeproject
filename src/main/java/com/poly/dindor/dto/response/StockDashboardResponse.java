package com.poly.dindor.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class StockDashboardResponse {
    private BigDecimal valeurTotale;
    private long nombreArticles;
    private long articlesEnAlerte;
    private long articlesEnRupture;
    private List<FamilleValeur> parFamille;

    @Data
    public static class FamilleValeur {
        private String famille;
        private BigDecimal valeur;
        private long nombreArticles;
    }
}
