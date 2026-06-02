package com.poly.dindor.service;

import com.poly.dindor.config.SecurityProperties;
import com.poly.dindor.dto.request.LoginRequest;
import com.poly.dindor.dto.response.AuthResponse;
import com.poly.dindor.entity.Admin;
import com.poly.dindor.entity.Employee;
import com.poly.dindor.repository.AdminRepository;
import com.poly.dindor.repository.EmployeeRepository;
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

    private final AdminRepository    adminRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder    passwordEncoder;
    private final JwtUtil            jwtUtil;
    private final AuditService       auditService;
    private final SecurityProperties securityProperties;

    // ── LOGIN ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = request.getEmail().toLowerCase().trim();

        var adminOpt = adminRepository.findByEmail(email);
        if (adminOpt.isPresent()) {
            return loginAdmin(adminOpt.get(), request, httpRequest);
        }

        var empOpt = employeeRepository.findByEmail(email);
        if (empOpt.isPresent()) {
            return loginEmployee(empOpt.get(), request);
        }

        auditService.logLoginAttempt(email, false, "Email non trouvé", httpRequest);
        throw new BadCredentialsException("Email ou mot de passe incorrect");
    }

    // ── Connexion Employé ──────────────────────────────────────────────────

    private AuthResponse loginEmployee(Employee emp, LoginRequest request) {
        if (!Boolean.TRUE.equals(emp.getActif())) {
            throw new IllegalStateException("Votre compte employé a été désactivé");
        }
        if (emp.getMotDePasse() == null) {
            throw new BadCredentialsException("Accès non configuré pour cet employé");
        }
        if (!passwordEncoder.matches(request.getPassword(), emp.getMotDePasse())) {
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }

        String accessToken = jwtUtil.generateToken(emp.getId(), emp.getEmail());

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(null)
                .expiresIn(jwtUtil.getExpiration() / 1000)
                .role("ROLE_EMPLOYE")
                .user(AuthResponse.UserInfo.builder()
                        .id(emp.getId())
                        .email(emp.getEmail())
                        .firstName(emp.getPrenom())
                        .lastName(emp.getNom())
                        .build())
                .build();
    }

    // ── Connexion Admin ────────────────────────────────────────────────────

    private AuthResponse loginAdmin(Admin admin, LoginRequest request, HttpServletRequest httpRequest) {
        String email = admin.getEmail();

        if (!admin.getActive()) {
            auditService.logLoginAttempt(email, false, "Compte désactivé", httpRequest);
            throw new IllegalStateException("Votre compte a été désactivé");
        }
        if (admin.isLocked()) {
            auditService.logLoginAttempt(email, false, "Compte verrouillé", httpRequest);
            throw new LockedException("Votre compte est verrouillé. Réessayez plus tard.");
        }
        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            handleFailedAdminLogin(admin, httpRequest);
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }

        admin.resetFailedAttempts();
        admin.setLastLogin(LocalDateTime.now());
        adminRepository.save(admin);
        auditService.logLoginAttempt(email, true, null, httpRequest);

        String accessToken  = jwtUtil.generateToken(admin.getId(), admin.getEmail());
        String refreshToken = Boolean.TRUE.equals(request.getRememberMe())
                ? jwtUtil.generateRefreshToken(admin.getId(), admin.getEmail()) : null;

        AuthResponse.AdminInfo adminInfo = AuthResponse.AdminInfo.builder()
                .id(admin.getId()).email(admin.getEmail())
                .firstName(admin.getFirstName()).lastName(admin.getLastName())
                .build();

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtUtil.getExpiration() / 1000)
                .role("ROLE_ADMIN")
                .user(AuthResponse.UserInfo.builder()
                        .id(admin.getId()).email(admin.getEmail())
                        .firstName(admin.getFirstName()).lastName(admin.getLastName())
                        .admin(adminInfo)
                        .build())
                .build();
    }

    // ── Refresh Token ──────────────────────────────────────────────────────

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        try {
            if (!jwtUtil.isRefreshToken(refreshToken)) {
                throw new IllegalArgumentException("Token invalide");
            }
            String email = jwtUtil.extractEmail(refreshToken);
            Admin admin  = adminRepository.findByEmail(email)
                    .orElseThrow(() -> new BadCredentialsException("Admin non trouvé"));
            if (!admin.getActive()) throw new IllegalStateException("Compte désactivé");

            String newAccessToken = jwtUtil.generateToken(admin.getId(), admin.getEmail());
            AuthResponse.AdminInfo adminInfo = AuthResponse.AdminInfo.builder()
                    .id(admin.getId()).email(admin.getEmail())
                    .firstName(admin.getFirstName()).lastName(admin.getLastName())
                    .build();
            return AuthResponse.builder()
                    .token(newAccessToken)
                    .refreshToken(refreshToken)
                    .expiresIn(jwtUtil.getExpiration() / 1000)
                    .role("ROLE_ADMIN")
                    .user(AuthResponse.UserInfo.builder()
                            .id(admin.getId()).email(admin.getEmail())
                            .firstName(admin.getFirstName()).lastName(admin.getLastName())
                            .admin(adminInfo)
                            .build())
                    .build();
        } catch (Exception e) {
            log.error("Erreur lors du refresh du token", e);
            throw new IllegalArgumentException("Token de rafraîchissement invalide");
        }
    }

    // ── Gestion verrouillage Admin ─────────────────────────────────────────

    private void handleFailedAdminLogin(Admin admin, HttpServletRequest request) {
        admin.incrementFailedAttempts();
        if (admin.getFailedLoginAttempts() >= securityProperties.getMaxLoginAttempts()) {
            admin.setLockedUntil(LocalDateTime.now().plusSeconds(
                    securityProperties.getLockoutDuration() / 1000));
            log.warn("Compte verrouillé après {} tentatives pour : {}",
                    admin.getFailedLoginAttempts(), admin.getEmail());
        }
        adminRepository.save(admin);
    }
}
