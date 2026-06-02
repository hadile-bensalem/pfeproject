package com.poly.dindor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ArticleDashboardItem {
    private String designation;
    private long nbAchats;
    private double prixMoyen;
    private double prixDernier;
    private double prixVariationPct;
    private double stockActuel;
    private double stockMinimum;
    private boolean stockCritique;
    private boolean stockBas;
    private String urgence;   // CRITIQUE / ALERTE / OK
    private String tendance;  // hausse / baisse / stable
    private double qteTotaleVendue;
    private double demandeHebdoMoyenne;
    private long nbVentes;
}
