package com.poly.dindor.controller;

import com.poly.dindor.dto.request.PaiementClientRequest;
import com.poly.dindor.dto.response.BonLivraisonResponse;
import com.poly.dindor.dto.response.ClientResponse;
import com.poly.dindor.dto.response.PaiementClientResponse;
import com.poly.dindor.service.ClientCreditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/clients-crediteurs")
@RequiredArgsConstructor
public class ClientCreditController {

    private final ClientCreditService creditService;

    @GetMapping
    public ResponseEntity<List<ClientResponse>> getAll() {
        return ResponseEntity.ok(creditService.getAllWithSolde());
    }

    @GetMapping("/{clientId}/bons")
    public ResponseEntity<List<BonLivraisonResponse>> getBons(@PathVariable Long clientId) {
        return ResponseEntity.ok(creditService.getBonsByClient(clientId));
    }

    @GetMapping("/{clientId}/paiements")
    public ResponseEntity<List<PaiementClientResponse>> getPaiements(@PathVariable Long clientId) {
        return ResponseEntity.ok(creditService.getPaiementsByClient(clientId));
    }

    @PostMapping("/{clientId}/paiements")
    public ResponseEntity<PaiementClientResponse> addPaiement(
            @PathVariable Long clientId,
            @Valid @RequestBody PaiementClientRequest request) {
        return ResponseEntity.ok(creditService.addPaiement(clientId, request));
    }

    @DeleteMapping("/{clientId}/paiements/{paiementId}")
    public ResponseEntity<Map<String, Object>> deletePaiement(
            @PathVariable Long clientId,
            @PathVariable Long paiementId) {
        creditService.deletePaiement(clientId, paiementId);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
