package com.poly.dindor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    
    private String token;
    private String refreshToken;
    @Builder.Default
    private String type = "Bearer";
    private Long expiresIn;
    private AdminInfo admin;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminInfo {
        private Long id;
        private String email;
        private String firstName;
        private String lastName;
    }
}
