package com.poly.dindor.controller;

import com.poly.dindor.dto.request.BonLivraisonRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.BonLivraisonResponse;
import com.poly.dindor.dto.response.RapportPeriodeRow;
import com.poly.dindor.dto.response.TopArticleClientResponse;
import com.poly.dindor.dto.response.VenteStatsResponse;
import com.poly.dindor.service.BonLivraisonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/vente")
@RequiredArgsConstructor
public class VenteController {

    private final BonLivraisonService blService;

    /** GET /api/vente/bons/next-number */
    @GetMapping("/bons/next-number")
    public ResponseEntity<ApiResponse<String>> getNextNumber() {
        return ResponseEntity.ok(ApiResponse.success(blService.getNextNumeroBL()));
    }

    /** GET /api/vente/bons?dateDebut=&dateFin=&modePaiement= */
    @GetMapping("/bons")
    public ResponseEntity<ApiResponse<List<BonLivraisonResponse>>> getBons(
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin,
            @RequestParam(required = false) String modePaiement) {
        return ResponseEntity.ok(ApiResponse.success(
                blService.getFiltered(dateDebut, dateFin, modePaiement)));
    }

    /** GET /api/vente/bons/{id} */
    @GetMapping("/bons/{id}")
    public ResponseEntity<ApiResponse<BonLivraisonResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(blService.getById(id)));
    }

    /** POST /api/vente/bons */
    @PostMapping("/bons")
    public ResponseEntity<ApiResponse<BonLivraisonResponse>> create(
            @Valid @RequestBody BonLivraisonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bon de livraison créé", blService.create(request)));
    }

    /** DELETE /api/vente/bons/{id} */
    @DeleteMapping("/bons/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        blService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Bon de livraison supprimé", null));
    }

    /** PATCH /api/vente/bons/{id}/etat-paiement?etat=PAYE */
    @PatchMapping("/bons/{id}/etat-paiement")
    public ResponseEntity<ApiResponse<BonLivraisonResponse>> updateEtat(
            @PathVariable Long id,
            @RequestParam String etat) {
        return ResponseEntity.ok(ApiResponse.success(
                "État mis à jour", blService.updateEtatPaiement(id, etat)));
    }

    /** GET /api/vente/last-price/{codeArticle} */
    @GetMapping("/last-price/{codeArticle}")
    public ResponseEntity<Map<String, Object>> getLastPrice(@PathVariable String codeArticle) {
        BigDecimal prix = blService.getLastPrice(codeArticle);
        return ResponseEntity.ok(Map.of(
                "found", prix != null,
                "prix",  prix != null ? prix : BigDecimal.ZERO
        ));
    }

    /** GET /api/vente/top-articles-client/{clientId}?limit=10 */
    @GetMapping("/top-articles-client/{clientId}")
    public ResponseEntity<ApiResponse<List<TopArticleClientResponse>>> getTopArticlesClient(
            @PathVariable Long clientId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(blService.getTopArticlesByClient(clientId, limit)));
    }

    /** GET /api/vente/rapport-periode?clientId=&dateDebut=&dateFin= */
    @GetMapping("/rapport-periode")
    public ResponseEntity<ApiResponse<List<RapportPeriodeRow>>> getRapportPeriode(
            @RequestParam Long clientId,
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin) {
        return ResponseEntity.ok(ApiResponse.success(
                blService.getRapportPeriode(clientId, dateDebut, dateFin)));
    }

    /** GET /api/vente/stats?dateDebut=&dateFin= */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<VenteStatsResponse>> getStats(
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin) {
        return ResponseEntity.ok(ApiResponse.success(blService.getStats(dateDebut, dateFin)));
    }
}
