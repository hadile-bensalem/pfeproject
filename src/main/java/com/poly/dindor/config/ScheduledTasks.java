package com.poly.dindor.config;

import com.poly.dindor.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {
    
    private final PasswordResetService passwordResetService;
    
    @Scheduled(cron = "0 0 2 * * ?") // Tous les jours à 2h du matin
    public void cleanupExpiredTokens() {
        log.info("Nettoyage automatique des tokens expirés");
        passwordResetService.cleanupExpiredTokens();
    }
}
