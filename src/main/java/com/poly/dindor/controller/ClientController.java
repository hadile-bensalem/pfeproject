package com.poly.dindor.controller;

import com.poly.dindor.dto.request.ClientRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.ClientResponse;
import com.poly.dindor.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClientResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(clientService.getAll()));
    }

    @GetMapping("/etat")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getEtat() {
        List<Map<String, Object>> etat = clientService.getAll().stream()
                .map(c -> {
                    Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("clientId", c.getId());
                    row.put("codeClient", c.getCodeClient());
                    row.put("nomClient", c.getNom());
                    row.put("solde", 0.0);
                    row.put("traitementEnCours", 0.0);
                    return row;
                })
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(etat));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(clientService.getById(id)));
    }

    @GetMapping("/{id}/transactions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTransactions(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(Collections.emptyList()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClientResponse>> create(@Valid @RequestBody ClientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Client créé", clientService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ClientRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Client mis à jour", clientService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        clientService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Client supprimé", null));
    }

    @DeleteMapping("/transactions/{transactionId}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(@PathVariable Long transactionId) {
        return ResponseEntity.ok(ApiResponse.success("Transaction supprimée", null));
    }

    @PostMapping("/factures-anciennes")
    public ResponseEntity<ApiResponse<Object>> saveAncienneFacture(@RequestBody Map<String, Object> form) {
        return ResponseEntity.ok(ApiResponse.success("Facture ancienne enregistrée", null));
    }
}
