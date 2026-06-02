package com.poly.dindor.controller;

import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.ArticleDashboardItem;
import com.poly.dindor.dto.response.ArticlePredictionSummary;
import com.poly.dindor.dto.response.PredictionResponse;
import com.poly.dindor.service.PredictionService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/prediction")
@RequiredArgsConstructor
@Validated
public class PredictionController {

    private final PredictionService predictionService;

    /**
     * GET /api/prediction/articles
     * Retourne la liste des articles ayant un historique d'achats.
     */
    @GetMapping("/articles")
    public ResponseEntity<ApiResponse<List<ArticlePredictionSummary>>> getArticles() {
        return ResponseEntity.ok(ApiResponse.success(predictionService.getArticlesWithHistory()));
    }

    /**
     * GET /api/prediction/predict?designation=Poulet
     * Lance la prédiction IA pour un article donné.
     */
    @GetMapping("/predict")
    public ResponseEntity<ApiResponse<PredictionResponse>> predict(
            @RequestParam @NotBlank(message = "La désignation de l'article est requise") String designation) {
        try {
            return ResponseEntity.ok(ApiResponse.success(predictionService.predict(designation)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(503)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/prediction/tableau-de-bord
     * Tous les articles avec historique d'achat, triés par urgence (CRITIQUE → ALERTE → OK).
     * Pas d'appel au service Python — réponse instantanée depuis la base.
     */
    @GetMapping("/tableau-de-bord")
    public ResponseEntity<ApiResponse<List<ArticleDashboardItem>>> getTableauDeBord() {
        return ResponseEntity.ok(ApiResponse.success(predictionService.getTableauDeBord()));
    }

    /**
     * GET /api/prediction/advisory?designation=Poulet
     * Données rapides (prix historique + stock) pour un article — utilisé dans le wizard achat.
     */
    @GetMapping("/advisory")
    public ResponseEntity<ApiResponse<ArticleDashboardItem>> getAdvisory(
            @RequestParam @NotBlank(message = "La désignation de l'article est requise") String designation) {
        ArticleDashboardItem result = predictionService.getAdvisoryData(designation);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
