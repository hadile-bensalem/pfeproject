package com.poly.dindor.service;

import com.poly.dindor.entity.LoginAttempt;
import com.poly.dindor.repository.LoginAttemptRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {
    
    private final LoginAttemptRepository loginAttemptRepository;
    
    @Transactional
    public void logLoginAttempt(String email, boolean success, String failureReason, HttpServletRequest request) {
        LoginAttempt attempt = LoginAttempt.builder()
            .email(email)
            .success(success)
            .failureReason(failureReason)
            .ipAddress(getClientIpAddress(request))
            .userAgent(request.getHeader("User-Agent"))
            .build();
        
        loginAttemptRepository.save(attempt);
        log.info("Tentative de connexion enregistrée - Email: {}, Succès: {}, IP: {}", 
            email, success, attempt.getIpAddress());
    }
    
    public long countFailedAttemptsSince(String email, LocalDateTime since) {
        return loginAttemptRepository.countFailedAttemptsSince(email, since);
    }
    
    public long countFailedAttemptsByIpSince(String ipAddress, LocalDateTime since) {
        return loginAttemptRepository.countFailedAttemptsByIpSince(ipAddress, since);
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
