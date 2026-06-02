package com.poly.dindor.controller;

import com.poly.dindor.dto.request.TransporteurRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.TransporteurResponse;
import com.poly.dindor.service.TransporteurService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/transporteur")
public class TransporteurController {

    private final TransporteurService service;

    public TransporteurController(TransporteurService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TransporteurResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransporteurResponse>> create(
            @Valid @RequestBody TransporteurRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Transporteur ajouté", service.create(request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Transporteur supprimé", null));
    }
}
