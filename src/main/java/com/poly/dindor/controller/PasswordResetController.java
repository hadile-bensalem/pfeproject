package com.poly.dindor.controller;

import com.poly.dindor.dto.request.PasswordResetConfirmRequest;
import com.poly.dindor.dto.request.PasswordResetRequest;
import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<Void>> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(
                "Un email de réinitialisation a été envoyé si l'adresse correspond à un compte existant.",
                null));
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmPasswordReset(
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Les mots de passe ne correspondent pas"));
        }
        passwordResetService.confirmPasswordReset(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Mot de passe réinitialisé avec succès.", null));
    }
}
