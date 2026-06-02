package com.poly.dindor.controller;

import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.EmployeeResponse;
import com.poly.dindor.dto.response.FichePaieResponse;
import com.poly.dindor.entity.Employee;
import com.poly.dindor.repository.EmployeeRepository;
import com.poly.dindor.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employe")
@RequiredArgsConstructor
public class EmployePortalController {

    private final EmployeeRepository employeeRepository;
    private final EmployeeService    employeeService;

    @GetMapping("/profil")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getProfil(
            @AuthenticationPrincipal UserDetails userDetails) {
        Employee emp = resolveEmployee(userDetails);
        return ResponseEntity.ok(ApiResponse.success(employeeService.getById(emp.getId())));
    }

    @GetMapping("/fiches-paie")
    public ResponseEntity<ApiResponse<List<FichePaieResponse>>> getFiches(
            @AuthenticationPrincipal UserDetails userDetails) {
        Employee emp = resolveEmployee(userDetails);
        return ResponseEntity.ok(ApiResponse.success(employeeService.getFichesByEmployee(emp.getId())));
    }

    @GetMapping("/fiches-paie/{id}")
    public ResponseEntity<ApiResponse<FichePaieResponse>> getFiche(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Employee emp = resolveEmployee(userDetails);
        FichePaieResponse fiche = employeeService.getFicheById(id);
        if (!fiche.getEmployeId().equals(emp.getId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
        }
        return ResponseEntity.ok(ApiResponse.success(fiche));
    }

    private Employee resolveEmployee(UserDetails userDetails) {
        return employeeRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Employé introuvable"));
    }
}
