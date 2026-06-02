package com.poly.dindor.controller;

import com.poly.dindor.dto.request.AjustementStockRequest;
import com.poly.dindor.dto.request.InventaireRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.LotStockResponse;
import com.poly.dindor.dto.response.MouvementStockResponse;
import com.poly.dindor.dto.response.StockArticleResponse;
import com.poly.dindor.dto.response.StockDashboardResponse;
import com.poly.dindor.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    /** GET /api/stock/dashboard */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<StockDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(stockService.getDashboard()));
    }

    /** GET /api/stock/articles */
    @GetMapping("/articles")
    public ResponseEntity<ApiResponse<List<StockArticleResponse>>> getStockArticles() {
        return ResponseEntity.ok(ApiResponse.success(stockService.getStockArticles()));
    }

    /** GET /api/stock/mouvements */
    @GetMapping("/mouvements")
    public ResponseEntity<ApiResponse<List<MouvementStockResponse>>> getMouvements() {
        return ResponseEntity.ok(ApiResponse.success(stockService.getMouvements()));
    }

    /** GET /api/stock/mouvements/article/{articleId} */
    @GetMapping("/mouvements/article/{articleId}")
    public ResponseEntity<ApiResponse<List<MouvementStockResponse>>> getMouvementsByArticle(
            @PathVariable Long articleId) {
        return ResponseEntity.ok(ApiResponse.success(
                stockService.getMouvementsByArticle(articleId)));
    }

    /** POST /api/stock/initialiser */
    @PostMapping("/initialiser")
    public ResponseEntity<ApiResponse<MouvementStockResponse>> initialiserStock(
            @Valid @RequestBody InventaireRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Stock initialisé avec succès", stockService.initialiserStock(request)));
    }

    /** POST /api/stock/ajustement */
    @PostMapping("/ajustement")
    public ResponseEntity<ApiResponse<MouvementStockResponse>> creerAjustement(
            @Valid @RequestBody AjustementStockRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Ajustement enregistré", stockService.creerAjustement(request)));
    }

    /** PATCH /api/stock/articles/{id}/seuil-minimum?valeur=XX */
    @PatchMapping("/articles/{id}/seuil-minimum")
    public ResponseEntity<ApiResponse<Void>> updateSeuilMinimum(
            @PathVariable Long id,
            @RequestParam BigDecimal valeur) {
        stockService.updateStockMinimum(id, valeur);
        return ResponseEntity.ok(ApiResponse.success("Seuil minimum mis à jour", null));
    }

    /** GET /api/stock/articles/{id}/lots — tous les lots d'un article (actifs + épuisés) */
    @GetMapping("/articles/{id}/lots")
    public ResponseEntity<ApiResponse<List<LotStockResponse>>> getLotsArticle(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(stockService.getLotsArticle(id)));
    }

    /** GET /api/stock/taux-moyen?articleId=X — taux de transformation moyen pondéré */
    @GetMapping("/taux-moyen")
    public ResponseEntity<ApiResponse<BigDecimal>> getTauxMoyen(@RequestParam Long articleId) {
        return ResponseEntity.ok(ApiResponse.success(stockService.getTauxMoyen(articleId)));
    }

    /** GET /api/stock/disponibilite?articleId=X&qte=Y */
    @GetMapping("/disponibilite")
    public ResponseEntity<ApiResponse<StockService.DisponibiliteResult>> verifierDisponibilite(
            @RequestParam Long articleId,
            @RequestParam BigDecimal qte) {
        return ResponseEntity.ok(ApiResponse.success(
                stockService.verifierDisponibilite(articleId, qte)));
    }
}
