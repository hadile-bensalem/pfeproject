package com.poly.dindor.service;

import com.poly.dindor.config.EmailProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
        }
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
