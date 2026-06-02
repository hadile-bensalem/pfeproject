package com.poly.dindor.controller;

import com.poly.dindor.dto.request.ClientRequest;
import com.poly.dindor.dto.response.ClientResponse;
import com.poly.dindor.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<List<ClientResponse>> getAll() {
        return ResponseEntity.ok(clientService.getAll());
    }

    @GetMapping("/actifs")
    public ResponseEntity<List<ClientResponse>> getActifs() {
        return ResponseEntity.ok(clientService.getActifs());
    }

    @GetMapping("/search")
    public ResponseEntity<List<ClientResponse>> search(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(clientService.search(q));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ClientResponse> create(@Valid @RequestBody ClientRequest request) {
        return ResponseEntity.ok(clientService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody ClientRequest request) {
        return ResponseEntity.ok(clientService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        clientService.delete(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
