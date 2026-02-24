package com.poly.dindor.controller;

import com.poly.dindor.dto.request.FamilleRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.FamilleResponse;
import com.poly.dindor.service.FamilleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/familles")
@RequiredArgsConstructor
public class FamilleController {

    private final FamilleService familleService;

    @PostMapping
    public ResponseEntity<ApiResponse<FamilleResponse>> create(@Valid @RequestBody FamilleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Famille créée", familleService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FamilleResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(familleService.getAll()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FamilleResponse>> update(
            @PathVariable Long id, @Valid @RequestBody FamilleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(familleService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        familleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Famille supprimée", null));
    }
}
