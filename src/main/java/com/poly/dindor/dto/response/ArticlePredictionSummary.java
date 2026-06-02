package com.poly.dindor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ArticlePredictionSummary {
    private String designation;
    private long nbVentes;
    private double prixMoyenRecent;
    private double qteTotaleVendue;
}
