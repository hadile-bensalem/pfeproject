package com.poly.dindor.controller;

import com.poly.dindor.dto.request.EmployeeRequest;
import com.poly.dindor.dto.request.FichePaieRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.EmployeeResponse;
import com.poly.dindor.dto.response.FichePaieResponse;
import com.poly.dindor.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/employes")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    // ── CRUD Employés ─────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(@Valid @RequestBody EmployeeRequest req) {
        EmployeeResponse created = employeeService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Employé créé", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> update(
            @PathVariable Long id, @Valid @RequestBody EmployeeRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Employé mis à jour", employeeService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Employé supprimé", null));
    }

    // ── Fiches de paie ────────────────────────────────────────────────────

    @GetMapping("/{id}/fiches-paie")
    public ResponseEntity<ApiResponse<List<FichePaieResponse>>> getFiches(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getFichesByEmployee(id)));
    }

    @PostMapping("/fiches-paie")
    public ResponseEntity<ApiResponse<FichePaieResponse>> genererFiche(@Valid @RequestBody FichePaieRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Fiche de paie générée", employeeService.genererFiche(req)));
    }

    @GetMapping("/fiches-paie/{ficheId}")
    public ResponseEntity<ApiResponse<FichePaieResponse>> getFiche(@PathVariable Long ficheId) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getFicheById(ficheId)));
    }

    @PatchMapping("/fiches-paie/{ficheId}/statut")
    public ResponseEntity<ApiResponse<FichePaieResponse>> updateStatut(
            @PathVariable Long ficheId, @RequestBody Map<String, String> body) {
        String statut = body.get("statut");
        LocalDate datePaiement = body.containsKey("datePaiement") && body.get("datePaiement") != null
                ? LocalDate.parse(body.get("datePaiement")) : null;
        return ResponseEntity.ok(ApiResponse.success(
                employeeService.updateStatutFiche(ficheId, statut, datePaiement)));
    }

    @DeleteMapping("/fiches-paie/{ficheId}")
    public ResponseEntity<ApiResponse<Void>> deleteFiche(@PathVariable Long ficheId) {
        employeeService.deleteFiche(ficheId);
        return ResponseEntity.ok(ApiResponse.success("Fiche supprimée", null));
    }
}
