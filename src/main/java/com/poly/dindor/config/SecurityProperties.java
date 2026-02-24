package com.poly.dindor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {
    
    private Integer maxLoginAttempts = 5;
    private Long lockoutDuration = 900000L; // 15 minutes en millisecondes
    
    @Data
    public static class Cors {
        private String allowedOrigins = "http://localhost:4200";
    }
    
    private Cors cors = new Cors();
}
