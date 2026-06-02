package com.poly.dindor.controller;

import com.poly.dindor.dto.request.DecoupePouletRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.DecoupePouletResponse;
import com.poly.dindor.service.DecoupePouletService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/decoupe-poulet")
public class DecoupePouletController {

    private final DecoupePouletService service;

    public DecoupePouletController(DecoupePouletService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DecoupePouletResponse>>> getAll(
            @RequestParam(required = false) String dateDebut,
            @RequestParam(required = false) String dateFin) {
        return ResponseEntity.ok(ApiResponse.success(service.getFiltered(dateDebut, dateFin)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DecoupePouletResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DecoupePouletResponse>> create(
            @Valid @RequestBody DecoupePouletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Découpe enregistrée avec succès", service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DecoupePouletResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody DecoupePouletRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Découpe modifiée avec succès", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Découpe supprimée", null));
    }
}
