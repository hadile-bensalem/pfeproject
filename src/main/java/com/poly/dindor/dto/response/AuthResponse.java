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

    /** ROLE_ADMIN | ROLE_CLIENT | ROLE_EMPLOYE */
    private String role;

    private UserInfo user;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private Long id;
        private String email;
        private String firstName;
        private String lastName;
        /** Pour garder la compatibilité avec l'ancien code admin */
        private AdminInfo admin;
    }

    /** Conservé pour compatibilité côté frontend admin */
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
