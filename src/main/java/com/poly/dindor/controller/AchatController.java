package com.poly.dindor.controller;

import com.poly.dindor.dto.request.FactureAchatRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.FactureAchatResponse;
import com.poly.dindor.service.FactureAchatPdfService;
import com.poly.dindor.service.FactureAchatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/achats")
@RequiredArgsConstructor
public class AchatController {

    private final FactureAchatService    factureAchatService;
    private final FactureAchatPdfService factureAchatPdfService;

    /**
     * GET /api/achats/factures/next-number
     * Retourne le prochain numéro de facture au format AAAA000001.
     */
    @GetMapping("/factures/next-number")
    public ResponseEntity<ApiResponse<String>> getNextNumber() {
        return ResponseEntity.ok(
            ApiResponse.success(factureAchatService.getNextNumero()));
    }

    /**
     * POST /api/achats/factures
     * Crée une facture d'achat avec ses lignes et son paiement.
     */
    @PostMapping("/factures")
    public ResponseEntity<ApiResponse<FactureAchatResponse>> createFacture(
            @Valid @RequestBody FactureAchatRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Facture créée avec succès",
                factureAchatService.create(request)));
    }

    /**
     * GET /api/achats/factures/{id}
     * Récupère une facture d'achat par son identifiant.
     */
    @GetMapping("/factures/{id}")
    public ResponseEntity<ApiResponse<FactureAchatResponse>> getFactureById(
            @PathVariable Long id) {
        return ResponseEntity.ok(
            ApiResponse.success(factureAchatService.getById(id)));
    }

    /**
     * GET /api/achats/factures
     * Retourne toutes les factures d'achat (ordre antéchronologique).
     */
    @GetMapping("/factures")
    public ResponseEntity<ApiResponse<java.util.List<FactureAchatResponse>>> getAllFactures() {
        return ResponseEntity.ok(ApiResponse.success(factureAchatService.getAll()));
    }

    /**
     * DELETE /api/achats/factures/{id}
     * Supprime une facture d'achat et ses lignes associées.
     */
    @DeleteMapping("/factures/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFacture(@PathVariable Long id) {
        factureAchatService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Facture supprimée", null));
    }

    /**
     * GET /api/achats/factures/{id}/pdf
     * Génère et retourne la facture fournisseur en PDF.
     */
    @GetMapping(value = "/factures/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadFacturePdf(@PathVariable Long id) {
        byte[] pdf = factureAchatPdfService.generateFacture(id);

        FactureAchatResponse facture = factureAchatService.getById(id);
        String filename = "facture-achat-" + facture.getNumeroFacture() + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentLength(pdf.length);

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}
