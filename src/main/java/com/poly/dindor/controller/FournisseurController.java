package com.poly.dindor.controller;

import com.poly.dindor.dto.request.FournisseurRequest;
import com.poly.dindor.dto.request.PaiementFournisseurRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.FournisseurEtatResponse;
import com.poly.dindor.dto.response.FournisseurResponse;
import com.poly.dindor.dto.response.TransactionFournisseurResponse;
import com.poly.dindor.service.FournisseurEtatService;
import com.poly.dindor.service.FournisseurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fournisseurs")
@RequiredArgsConstructor
public class FournisseurController {

    private final FournisseurService    fournisseurService;
    private final FournisseurEtatService fournisseurEtatService;

    @PostMapping
    public ResponseEntity<ApiResponse<FournisseurResponse>> create(@Valid @RequestBody FournisseurRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Fournisseur créé", fournisseurService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FournisseurResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(fournisseurService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FournisseurResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(fournisseurService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FournisseurResponse>> update(
            @PathVariable Long id, @Valid @RequestBody FournisseurRequest request) {
        return ResponseEntity.ok(ApiResponse.success(fournisseurService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        fournisseurService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Supprimé", null));
    }

    /** GET /fournisseurs/etat — solde + traite en cours par fournisseur */
    @GetMapping("/etat")
    public ResponseEntity<ApiResponse<List<FournisseurEtatResponse>>> getEtat() {
        return ResponseEntity.ok(ApiResponse.success(fournisseurEtatService.getEtatFournisseurs()));
    }

    /** GET /fournisseurs/{id}/transactions — journal débit/crédit d'un fournisseur */
    @GetMapping("/{id}/transactions")
    public ResponseEntity<ApiResponse<List<TransactionFournisseurResponse>>> getTransactions(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                fournisseurEtatService.getTransactionsByFournisseur(id)));
    }

    /** POST /fournisseurs/{id}/paiements — enregistrer un règlement fournisseur */
    @PostMapping("/{id}/paiements")
    public ResponseEntity<ApiResponse<Void>> addPaiement(
            @PathVariable Long id,
            @Valid @RequestBody PaiementFournisseurRequest request) {
        fournisseurEtatService.addPaiement(id, request);
        return ResponseEntity.ok(ApiResponse.success("Règlement enregistré", null));
    }

    /** DELETE /fournisseurs/paiements/{pid} — supprimer un règlement */
    @DeleteMapping("/paiements/{pid}")
    public ResponseEntity<ApiResponse<Void>> deletePaiement(@PathVariable Long pid) {
        fournisseurEtatService.deletePaiement(pid);
        return ResponseEntity.ok(ApiResponse.success("Règlement supprimé", null));
    }
}
