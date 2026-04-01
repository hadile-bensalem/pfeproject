package com.poly.dindor.controller;

import com.poly.dindor.dto.request.RetenueSourceRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.RetenueSourceResponse;
import com.poly.dindor.service.RetenuePdfService;
import com.poly.dindor.service.RetenueSourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/retenue-source")
@RequiredArgsConstructor
public class RetenueSourceController {

    private final RetenueSourceService retenueSourceService;
    private final RetenuePdfService    retenuePdfService;

    // ── CRUD ──────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<RetenueSourceResponse>> create(
            @Valid @RequestBody RetenueSourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Certificat créé avec succès",
                        retenueSourceService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RetenueSourceResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(retenueSourceService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RetenueSourceResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(retenueSourceService.getById(id)));
    }

    @GetMapping("/fournisseur/{fournisseurId}")
    public ResponseEntity<ApiResponse<List<RetenueSourceResponse>>> getByFournisseur(
            @PathVariable Long fournisseurId) {
        return ResponseEntity.ok(ApiResponse.success(
                retenueSourceService.getByFournisseur(fournisseurId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        retenueSourceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Certificat supprimé", null));
    }

    // ── PDF ───────────────────────────────────────────────────────────────

    /**
     * GET /api/retenue-source/{id}/pdf
     * Retourne le certificat de retenue à la source en format PDF.
     */
    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        byte[] pdf = retenuePdfService.generateCertificat(id);

        RetenueSourceResponse rs = retenueSourceService.getById(id);
        String filename = "retenue-source-" + rs.getNumeroDocument() + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentLength(pdf.length);

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}
