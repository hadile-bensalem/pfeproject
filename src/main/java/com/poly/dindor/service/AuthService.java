package com.poly.dindor.service;

import com.poly.dindor.config.SecurityProperties;
import com.poly.dindor.dto.request.LoginRequest;
import com.poly.dindor.dto.response.AuthResponse;
import com.poly.dindor.entity.Admin;
import com.poly.dindor.repository.AdminRepository;
import com.poly.dindor.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;
    private final SecurityProperties securityProperties;
    
    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = request.getEmail().toLowerCase().trim();
        
        Admin admin = adminRepository.findByEmail(email)
            .orElseGet(() -> {
                auditService.logLoginAttempt(email, false, "Email non trouvé", httpRequest);
                throw new BadCredentialsException("Email ou mot de passe incorrect");
            });
        
        // Vérifier si le compte est actif
        if (!admin.getActive()) {
            auditService.logLoginAttempt(email, false, "Compte désactivé", httpRequest);
            throw new IllegalStateException("Votre compte a été désactivé");
        }
        
        // Vérifier si le compte est verrouillé
        if (admin.isLocked()) {
            auditService.logLoginAttempt(email, false, "Compte verrouillé", httpRequest);
            throw new LockedException("Votre compte est verrouillé. Réessayez plus tard.");
        }
        
        // Vérifier le mot de passe
        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            handleFailedLogin(admin, httpRequest);
            auditService.logLoginAttempt(email, false, "Mot de passe incorrect", httpRequest);
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }
        
        // Connexion réussie
        admin.resetFailedAttempts();
        admin.setLastLogin(LocalDateTime.now());
        adminRepository.save(admin);
        
        auditService.logLoginAttempt(email, true, null, httpRequest);
        
        // Générer les tokens JWT
        String accessToken = jwtUtil.generateToken(admin.getId(), admin.getEmail());
        String refreshToken = request.getRememberMe() ? jwtUtil.generateRefreshToken(admin.getId(), admin.getEmail()) : null;
        
        log.info("Connexion réussie pour l'admin : {}", email);
        
        return AuthResponse.builder()
            .token(accessToken)
            .refreshToken(refreshToken)
            .expiresIn(jwtUtil.getExpiration() / 1000) // Conversion en secondes
            .admin(AuthResponse.AdminInfo.builder()
                .id(admin.getId())
                .email(admin.getEmail())
                .firstName(admin.getFirstName())
                .lastName(admin.getLastName())
                .build())
            .build();
    }
    
    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        try {
            if (!jwtUtil.isRefreshToken(refreshToken)) {
                throw new IllegalArgumentException("Token invalide");
            }
            
            String email = jwtUtil.extractEmail(refreshToken);
            
            Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Admin non trouvé"));
            
            if (!admin.getActive()) {
                throw new IllegalStateException("Compte désactivé");
            }
            
            String newAccessToken = jwtUtil.generateToken(admin.getId(), admin.getEmail());
            
            return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtUtil.getExpiration() / 1000) // Conversion en secondes
                .admin(AuthResponse.AdminInfo.builder()
                    .id(admin.getId())
                    .email(admin.getEmail())
                    .firstName(admin.getFirstName())
                    .lastName(admin.getLastName())
                    .build())
                .build();
        } catch (Exception e) {
            log.error("Erreur lors du refresh du token", e);
            throw new IllegalArgumentException("Token de rafraîchissement invalide");
        }
    }
    
    private void handleFailedLogin(Admin admin, HttpServletRequest request) {
        admin.incrementFailedAttempts();
        
        if (admin.getFailedLoginAttempts() >= securityProperties.getMaxLoginAttempts()) {
            admin.setLockedUntil(LocalDateTime.now().plusSeconds(
                securityProperties.getLockoutDuration() / 1000
            ));
            log.warn("Compte verrouillé après {} tentatives échouées pour : {}", 
                admin.getFailedLoginAttempts(), admin.getEmail());
        }
        
        adminRepository.save(admin);
    }
}
