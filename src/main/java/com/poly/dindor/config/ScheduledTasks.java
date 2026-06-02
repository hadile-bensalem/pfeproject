package com.poly.dindor.config;

import com.poly.dindor.entity.LotStock;
import com.poly.dindor.entity.PaiementAchat;
import com.poly.dindor.repository.PaiementAchatRepository;
import com.poly.dindor.service.PasswordResetService;
import com.poly.dindor.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final PasswordResetService   passwordResetService;
    private final StockService           stockService;
    private final JavaMailSender         mailSender;
    private final PaiementAchatRepository paiementAchatRepository;

    // ── Tokens expirés ────────────────────────────────────────────────────

    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupExpiredTokens() {
        log.info("[SCHEDULER] Nettoyage tokens expirés");
        passwordResetService.cleanupExpiredTokens();
    }

    // ── Lots périmés (8h00) ───────────────────────────────────────────────

    @Scheduled(cron = "0 0 8 * * ?")
    public void gererLotsPeremption() {
        log.info("[SCHEDULER] Gestion péremption lots stock");

        List<LotStock> bientotPerimes = stockService.findLotsProchesPeremption(3);
        if (!bientotPerimes.isEmpty()) {
            log.warn("[SCHEDULER] {} lot(s) périssent dans moins de 3 jours", bientotPerimes.size());
            try {
                StringBuilder sb = new StringBuilder("Lots expirant dans 3 jours :\n");
                bientotPerimes.forEach(l -> sb.append(String.format(
                        "  - Lot #%d | %s | Date péremption : %s | Qté restante : %s%n",
                        l.getId(), l.getArticleOrigine().getDesignation(),
                        l.getDatePeremption(), l.getQteOrigineRestante())));
                sendMail(
                        "admin@dindor.tn",
                        "[Dind'Or] Alerte péremption stock",
                        sb.toString());
            } catch (Exception e) {
                log.error("[SCHEDULER] Erreur envoi alerte péremption : {}", e.getMessage());
            }
        }

        stockService.desactiverLotsPerimes();
        log.info("[SCHEDULER] Lots périmés désactivés");
    }

    // ── Traites à échéance (8h30) ─────────────────────────────────────────

    @Scheduled(cron = "0 30 8 * * ?")
    public void alerterTraitesEcheance() {
        log.info("[SCHEDULER] Vérification traites à échéance prochaine");

        LocalDate today = LocalDate.now();
        List<PaiementAchat> traites = paiementAchatRepository.findTraitesEcheantDans(today, today.plusDays(3));

        if (!traites.isEmpty()) {
            log.warn("[SCHEDULER] {} traite(s) à échéance dans 3 jours", traites.size());
            StringBuilder sb = new StringBuilder("Traites à échéance dans les 3 prochains jours :\n\n");
            traites.forEach(p -> {
                long jours = java.time.temporal.ChronoUnit.DAYS.between(today, p.getDateEcheance());
                sb.append(String.format(
                        "  - Traite N°%s | Facture %s | %s | %.3f DT | Échéance : %s (%s)%n",
                        p.getNumeroTraite() != null ? p.getNumeroTraite() : "—",
                        p.getFactureAchat().getNumeroFacture(),
                        p.getFactureAchat().getFournisseur().getRaisonSociale(),
                        p.getMontantReste(),
                        p.getDateEcheance(),
                        jours == 0 ? "Aujourd'hui" : "J-" + jours));
            });
            sendMail("admin@dindor.tn", "[Dind'Or] Alerte traites à échéance", sb.toString());
        }
    }

    // ── Helper mail ───────────────────────────────────────────────────────

    private void sendMail(String to, String subject, String text) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(text);
            mailSender.send(msg);
        } catch (Exception e) {
            log.error("[SCHEDULER] Échec envoi email à {} : {}", to, e.getMessage());
        }
    }
}
