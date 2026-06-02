package com.poly.dindor.controller;

import com.poly.dindor.dto.request.FactureClientRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.FactureClientResponse;
import com.poly.dindor.dto.response.RapportPeriodeRow;
import com.poly.dindor.dto.response.TopArticleClientResponse;
import com.poly.dindor.dto.response.VenteStatsResponse;
import com.poly.dindor.service.FactureClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/facture-client")
@RequiredArgsConstructor
public class FactureClientController {

    private final FactureClientService service;

    /** GET /api/facture-client/next-number */
    @GetMapping("/next-number")
    public ResponseEntity<ApiResponse<String>> getNextNumber() {
        return ResponseEntity.ok(ApiResponse.success(service.getNextNumeroFacture()));
    }

    /** GET /api/facture-client/next-number-bl */
    @GetMapping("/next-number-bl")
    public ResponseEntity<ApiResponse<String>> getNextNumberBL() {
        return ResponseEntity.ok(ApiResponse.success(service.getNextNumeroBL()));
    }

    /** GET /api/facture-client?dateDebut=&dateFin=&modePaiement=&typeDocument= */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FactureClientResponse>>> getAll(
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin,
            @RequestParam(required = false) String modePaiement,
            @RequestParam(required = false) String typeDocument) {
        return ResponseEntity.ok(ApiResponse.success(
                service.getFiltered(dateDebut, dateFin, modePaiement, typeDocument)));
    }

    /** GET /api/facture-client/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FactureClientResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    /** POST /api/facture-client */
    @PostMapping
    public ResponseEntity<ApiResponse<FactureClientResponse>> create(
            @Valid @RequestBody FactureClientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Facture client créée", service.create(request)));
    }

    /** DELETE /api/facture-client/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Facture client supprimée", null));
    }

    /** PATCH /api/facture-client/{id}/etat-paiement?etat=PAYE */
    @PatchMapping("/{id}/etat-paiement")
    public ResponseEntity<ApiResponse<FactureClientResponse>> updateEtat(
            @PathVariable Long id,
            @RequestParam String etat) {
        return ResponseEntity.ok(ApiResponse.success(
                "État mis à jour", service.updateEtatPaiement(id, etat)));
    }

    /** GET /api/facture-client/last-price/{codeArticle} */
    @GetMapping("/last-price/{codeArticle}")
    public ResponseEntity<Map<String, Object>> getLastPrice(@PathVariable String codeArticle) {
        BigDecimal prix = service.getLastPrice(codeArticle);
        return ResponseEntity.ok(Map.of(
                "found", prix != null,
                "prix",  prix != null ? prix : BigDecimal.ZERO
        ));
    }

    /** GET /api/facture-client/top-articles-client/{clientId}?limit=10 */
    @GetMapping("/top-articles-client/{clientId}")
    public ResponseEntity<ApiResponse<List<TopArticleClientResponse>>> getTopArticlesClient(
            @PathVariable Long clientId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(service.getTopArticlesByClient(clientId, limit)));
    }

    /** GET /api/facture-client/rapport-periode?clientId=&dateDebut=&dateFin= */
    @GetMapping("/rapport-periode")
    public ResponseEntity<ApiResponse<List<RapportPeriodeRow>>> getRapportPeriode(
            @RequestParam Long clientId,
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin) {
        return ResponseEntity.ok(ApiResponse.success(
                service.getRapportPeriode(clientId, dateDebut, dateFin)));
    }

    /** GET /api/facture-client/stats?dateDebut=&dateFin= */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<VenteStatsResponse>> getStats(
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin) {
        return ResponseEntity.ok(ApiResponse.success(service.getStats(dateDebut, dateFin)));
    }
}
