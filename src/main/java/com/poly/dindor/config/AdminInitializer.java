package com.poly.dindor.config;

import com.poly.dindor.entity.Admin;
import com.poly.dindor.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer implements CommandLineRunner {
    
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${app.admin.email}")
    private String adminEmail;
    
    @Value("${app.admin.password}")
    private String adminPassword;
    
    @Value("${app.admin.firstName}")
    private String adminFirstName;
    
    @Value("${app.admin.lastName}")
    private String adminLastName;
    
    @Override
    public void run(String... args) {
        if (adminRepository.existsByEmail(adminEmail)) {
            log.info("Le compte administrateur existe déjà : {}", adminEmail);
            return;
        }
        
        Admin admin = Admin.builder()
            .email(adminEmail)
            .password(passwordEncoder.encode(adminPassword))
            .firstName(adminFirstName)
            .lastName(adminLastName)
            .active(true)
            .build();
        
        adminRepository.save(admin);
        log.info("Compte administrateur créé avec succès : {}", adminEmail);
    }
}
