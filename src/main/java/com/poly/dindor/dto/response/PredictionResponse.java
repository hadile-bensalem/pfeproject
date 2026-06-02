package com.poly.dindor.dto.response;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class PredictionResponse {

    private String article;

    @JsonAlias("prix_actuel")
    private double prixActuel;

    private List<PredictionPointResponse> predictions;
    private String tendance;
    private String recommendation;
    private double confiance;
    private String message;

    @JsonAlias("periode_courante")
    private String periodeCourante;

    private List<Map<String, Object>> historique;

    @JsonAlias("forecast_chart")
    private List<Map<String, Object>> forecastChart;

    private String modele;

    // ── Contexte stock ────────────────────────────────────────────────────────

    /** Stock disponible actuellement (en unités). */
    @JsonAlias("stock_actuel")
    private double stockActuel;

    /** Seuil de stock minimum configuré pour cet article. */
    @JsonAlias("stock_minimum")
    private double stockMinimum;

    /** Quantité totale engagée dans les commandes clients EN_ATTENTE ou CONFIRMEE. */
    @JsonAlias("quantite_commandee")
    private double quantiteCommandee;

    /** Stock net après déduction des commandes en cours. */
    @JsonAlias("stock_net")
    private double stockNet;

    /** Quantité recommandée à acheter pour couvrir la demande + le stock de sécurité. */
    @JsonAlias("quantite_a_acheter")
    private double quantiteAAcheter;

    /** Vrai si le stock est critique (en dessous du minimum ou insuffisant pour les commandes). */
    @JsonAlias("stock_critique")
    private boolean stockCritique;

    /** Demande hebdomadaire moyenne calculée sur les 90 derniers jours de ventes. */
    @JsonAlias("demande_hebdo_moyenne")
    private double demandeHebdoMoyenne;

    // ── Sources de données ───────────────────────────────────────────────────

    @JsonAlias("nb_points_db")
    private int nbPointsDb;

    @JsonAlias("nb_points_excel")
    private int nbPointsExcel;

    @JsonAlias("nb_points_total")
    private int nbPointsTotal;
}
