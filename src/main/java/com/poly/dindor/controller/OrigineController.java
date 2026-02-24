package com.poly.dindor.controller;

import com.poly.dindor.dto.request.OrigineRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.OrigineResponse;
import com.poly.dindor.service.OrigineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/origines")
@RequiredArgsConstructor
public class OrigineController {

    private final OrigineService origineService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrigineResponse>> create(@Valid @RequestBody OrigineRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Origine créée", origineService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrigineResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(origineService.getAll()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OrigineResponse>> update(
            @PathVariable Long id, @Valid @RequestBody OrigineRequest request) {
        return ResponseEntity.ok(ApiResponse.success(origineService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        origineService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Origine supprimée", null));
    }
}
