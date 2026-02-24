package com.poly.dindor.controller;

import com.poly.dindor.dto.request.EmployeeRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.EmployeeResponse;
import com.poly.dindor.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(@Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employé créé", employeeService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> update(
            @PathVariable Long id, @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Supprimé", null));
    }
}
