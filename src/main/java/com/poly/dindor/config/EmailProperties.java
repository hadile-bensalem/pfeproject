package com.poly.dindor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.mail")
public class EmailProperties {
    
    private String from;
    private String fromName;
}
