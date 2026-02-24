package com.poly.dindor.service;

import com.poly.dindor.config.PasswordResetProperties;
import com.poly.dindor.entity.Admin;
import com.poly.dindor.entity.PasswordResetToken;
import com.poly.dindor.repository.AdminRepository;
import com.poly.dindor.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {
    
    private final AdminRepository adminRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetProperties passwordResetProperties;
    
    @Value("${app.mail.from}")
    private String officialEmail;
    
    @Value("${app.password-reset.reset-url:http://localhost:4200/reset-password}")
    private String resetUrl;
    
    @Transactional
    public void requestPasswordReset(String email) {
        // Vérifier que l'email correspond à l'email officiel de la société
        if (!email.equalsIgnoreCase(officialEmail)) {
            log.warn("Tentative de réinitialisation avec un email non autorisé : {}", email);
            throw new IllegalArgumentException("Seul l'email officiel de Dind'Or peut demander une réinitialisation");
        }
        
        Admin admin = adminRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Aucun compte administrateur trouvé avec cet email"));
        
        if (!admin.getActive()) {
            throw new IllegalStateException("Le compte administrateur est désactivé");
        }
        
        // Supprimer les anciens tokens non utilisés
        tokenRepository.deleteByAdminId(admin.getId());
        
        // Générer un nouveau token sécurisé
        String token = generateSecureToken();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(
            passwordResetProperties.getTokenExpiration() / 1000
        );
        
        PasswordResetToken resetToken = PasswordResetToken.builder()
            .token(token)
            .admin(admin)
            .expiresAt(expiresAt)
            .maxAttempts(passwordResetProperties.getMaxAttempts())
            .build();
        
        tokenRepository.save(resetToken);
        
        // Envoyer l'email de réinitialisation
        emailService.sendPasswordResetEmail(email, token, resetUrl);
        
        log.info("Token de réinitialisation généré pour l'admin : {}", admin.getEmail());
    }
    
    @Transactional
    public void confirmPasswordReset(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Token invalide ou expiré"));
        
        if (!resetToken.isValid()) {
            resetToken.incrementAttempts();
            tokenRepository.save(resetToken);
            throw new IllegalStateException("Token invalide, expiré ou trop de tentatives");
        }
        
        Admin admin = resetToken.getAdmin();
        
        // Vérifier que le nouveau mot de passe est différent de l'ancien
        if (passwordEncoder.matches(newPassword, admin.getPassword())) {
            throw new IllegalArgumentException("Le nouveau mot de passe doit être différent de l'ancien");
        }
        
        // Mettre à jour le mot de passe
        admin.setPassword(passwordEncoder.encode(newPassword));
        admin.resetFailedAttempts();
        adminRepository.save(admin);
        
        // Marquer le token comme utilisé
        resetToken.markAsUsed();
        tokenRepository.save(resetToken);
        
        log.info("Mot de passe réinitialisé avec succès pour l'admin : {}", admin.getEmail());
    }
    
    private String generateSecureToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    
    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.debug("Nettoyage des tokens expirés effectué");
    }
}
