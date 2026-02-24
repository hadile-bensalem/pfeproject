package com.poly.dindor.controller;

import com.poly.dindor.dto.request.FournisseurRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.FournisseurResponse;
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

    private final FournisseurService fournisseurService;

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
}
