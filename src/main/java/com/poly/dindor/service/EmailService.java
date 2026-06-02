package com.poly.dindor.service;

import com.poly.dindor.config.EmailProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    private final EmailProperties emailProperties;
    
    public void sendPasswordResetEmail(String to, String resetToken, String resetUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            try {
                helper.setFrom(emailProperties.getFrom(), emailProperties.getFromName());
            } catch (UnsupportedEncodingException e) {
                helper.setFrom(emailProperties.getFrom());
            }
            helper.setTo(to);
            helper.setSubject("Réinitialisation de votre mot de passe - Dind'Or Administration");
            
            String htmlContent = buildPasswordResetEmail(resetToken, resetUrl);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Email de réinitialisation envoyé à : {}", to);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email de réinitialisation à : {}", to, e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        } catch (MailException e) {
            log.error("Erreur SMTP (mot de passe manquant ou compte non configuré) : {}", e.getMessage());
            throw new MailException("Service email non disponible. Vérifiez la configuration SMTP (mot de passe Gmail App Password).") {};
        }
    }
    
    // ── Notification nouveau message de contact ───────────────────────────

    public void sendContactNotification(String nom, String emailExpéditeur, String messageText) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            try {
                helper.setFrom(emailProperties.getFrom(), emailProperties.getFromName());
            } catch (UnsupportedEncodingException e) {
                helper.setFrom(emailProperties.getFrom());
            }
            helper.setTo(emailProperties.getFrom()); // envoi à l'admin
            helper.setSubject("📩 Nouveau message de contact — " + nom);
            helper.setText(buildContactEmail(nom, emailExpéditeur, messageText), true);
            mailSender.send(message);
            log.info("Notification contact envoyée pour : {} ({})", nom, emailExpéditeur);
        } catch (MessagingException e) {
            log.warn("Échec envoi email de contact : {}", e.getMessage());
        }
    }

    private String buildContactEmail(String nom, String email, String messageText) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #8B1A1A, #6B1414); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
                    .header h1 { margin: 0; font-size: 22px; }
                    .badge { display: inline-block; background: #DAA520; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; margin-top: 8px; }
                    .content { background: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0; }
                    .field { background: white; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px; border-left: 4px solid #8B1A1A; }
                    .field-label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                    .field-value { font-size: 15px; color: #222; font-weight: 500; }
                    .message-box { background: white; border-radius: 6px; padding: 16px 18px; border-left: 4px solid #DAA520; white-space: pre-wrap; line-height: 1.7; }
                    .footer { text-align: center; padding: 16px; font-size: 12px; color: #888; border-top: 1px solid #e0e0e0; background: #fff; border-radius: 0 0 8px 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Dind'Or — Message de Contact</h1>
                        <div class="badge">Nouveau message reçu</div>
                    </div>
                    <div class="content">
                        <div class="field">
                            <div class="field-label">Nom complet</div>
                            <div class="field-value">%s</div>
                        </div>
                        <div class="field">
                            <div class="field-label">Email</div>
                            <div class="field-value"><a href="mailto:%s">%s</a></div>
                        </div>
                        <div class="field-label" style="margin-bottom:6px;">Message</div>
                        <div class="message-box">%s</div>
                    </div>
                    <div class="footer">
                        <p>Message reçu via le formulaire de contact du site Dind'Or.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(nom, email, email, messageText);
    }

    private String buildPasswordResetEmail(String token, String resetUrl) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #8B1A1A; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #DAA520; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                    .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Dind'Or Administration</h1>
                    </div>
                    <div class="content">
                        <h2>Réinitialisation de votre mot de passe</h2>
                        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte administrateur Dind'Or.</p>
                        <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
                        <p style="text-align: center;">
                            <a href="%s?token=%s" class="button">Réinitialiser mon mot de passe</a>
                        </p>
                        <p>Ou copiez-collez ce lien dans votre navigateur :</p>
                        <p style="word-break: break-all; color: #8B1A1A;">%s?token=%s</p>
                        <div class="warning">
                            <strong>⚠️ Important :</strong>
                            <ul>
                                <li>Ce lien est valide pendant 1 heure uniquement</li>
                                <li>Vous avez 3 tentatives pour utiliser ce lien</li>
                                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Cet email a été envoyé depuis l'adresse officielle de Dind'Or.</p>
                        <p>Ne répondez pas à cet email.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(resetUrl, token, resetUrl, token);
    }
}
