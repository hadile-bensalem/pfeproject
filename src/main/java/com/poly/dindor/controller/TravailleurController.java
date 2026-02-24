package com.poly.dindor.controller;

import com.poly.dindor.dto.request.PointageRequest;
import com.poly.dindor.dto.request.TravailleurRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.PointageResponse;
import com.poly.dindor.dto.response.TravailleurResponse;
import com.poly.dindor.service.PointageService;
import com.poly.dindor.service.TravailleurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/travailleurs")
@RequiredArgsConstructor
public class TravailleurController {

    private final TravailleurService travailleurService;
    private final PointageService pointageService;

    @PostMapping
    public ResponseEntity<ApiResponse<TravailleurResponse>> create(@Valid @RequestBody TravailleurRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Travailleur créé", travailleurService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TravailleurResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(travailleurService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TravailleurResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(travailleurService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TravailleurResponse>> update(
            @PathVariable Long id, @Valid @RequestBody TravailleurRequest request) {
        return ResponseEntity.ok(ApiResponse.success(travailleurService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        travailleurService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Supprimé", null));
    }

    @GetMapping("/{travailleurId}/pointages")
    public ResponseEntity<ApiResponse<List<PointageResponse>>> getPointages(@PathVariable Long travailleurId) {
        return ResponseEntity.ok(ApiResponse.success(pointageService.getHistorique(travailleurId)));
    }

    @PostMapping("/{travailleurId}/pointages")
    public ResponseEntity<ApiResponse<PointageResponse>> createPointage(
            @PathVariable Long travailleurId,
            @Valid @RequestBody PointageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pointage créé", pointageService.create(travailleurId, request)));
    }
}
