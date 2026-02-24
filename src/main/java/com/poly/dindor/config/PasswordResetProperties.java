package com.poly.dindor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.password-reset")
public class PasswordResetProperties {
    
    private Long tokenExpiration = 3600000L; // 1 heure en millisecondes
    private Integer maxAttempts = 3;
}
