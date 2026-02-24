package com.poly.dindor.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetRequest {
    
    @NotBlank(message = "L'email est requis")
    @Email(message = "L'email doit être valide")
    private String email;
}
