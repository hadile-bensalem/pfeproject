package com.poly.dindor.controller;

import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.AuthResponse;
import com.poly.dindor.entity.Admin;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminRepository adminRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.AdminInfo>> getCurrentAdmin(Authentication authentication) {
        String email = authentication.getName();
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin introuvable"));
        AuthResponse.AdminInfo adminInfo = AuthResponse.AdminInfo.builder()
                .id(admin.getId())
                .email(admin.getEmail())
                .firstName(admin.getFirstName())
                .lastName(admin.getLastName())
                .build();
        return ResponseEntity.ok(ApiResponse.success(adminInfo));
    }
}
