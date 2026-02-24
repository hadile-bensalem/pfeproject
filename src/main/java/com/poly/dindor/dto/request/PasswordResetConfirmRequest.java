package com.poly.dindor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetConfirmRequest {
    
    @NotBlank(message = "Le token est requis")
    private String token;
    
    @NotBlank(message = "Le nouveau mot de passe est requis")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial"
    )
    private String newPassword;
    
    @NotBlank(message = "La confirmation du mot de passe est requise")
    private String confirmPassword;
}
