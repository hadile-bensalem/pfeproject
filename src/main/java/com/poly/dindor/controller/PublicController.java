package com.poly.dindor.controller;

import com.poly.dindor.entity.Article;
import com.poly.dindor.entity.ContactMessage;
import com.poly.dindor.repository.ArticleRepository;
import com.poly.dindor.repository.ContactMessageRepository;
import com.poly.dindor.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
@Slf4j
public class PublicController {

    private final ArticleRepository        articleRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final EmailService             emailService;

    // ── GET /public/articles ──────────────────────────────────────────────
    @GetMapping("/articles")
    public ResponseEntity<List<Map<String, Object>>> getArticlesPublics() {
        List<Article> articles = articleRepository.findAll();
        List<Map<String, Object>> result = articles.stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("codeArticle",  a.getCodeArticle());
            m.put("designation",  a.getDesignation());
            m.put("unite",        a.getUnite());
            m.put("famille",      a.getFamille());
            m.put("prixVente",    a.getPrixVente());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── POST /public/contact ──────────────────────────────────────────────
    @PostMapping("/contact")
    public ResponseEntity<Map<String, Object>> contact(@RequestBody Map<String, String> body) {
        String nom     = body.getOrDefault("nom",     "").trim();
        String email   = body.getOrDefault("email",   "").trim().toLowerCase();
        String message = body.getOrDefault("message", "").trim();

        if (nom.isEmpty() || email.isEmpty() || message.isEmpty()) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("success", false);
            err.put("message", "Nom, email et message sont obligatoires.");
            return ResponseEntity.badRequest().body(err);
        }
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("success", false);
            err.put("message", "Format d'email invalide.");
            return ResponseEntity.badRequest().body(err);
        }
        if (message.length() > 2000) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("success", false);
            err.put("message", "Le message ne peut pas dépasser 2000 caractères.");
            return ResponseEntity.badRequest().body(err);
        }

        ContactMessage contact = ContactMessage.builder()
                .nom(nom)
                .email(email)
                .message(message)
                .build();
        contactMessageRepository.save(contact);
        log.info("Nouveau message de contact de : {} ({})", nom, email);

        try {
            emailService.sendContactNotification(nom, email, message);
        } catch (Exception e) {
            log.warn("Notification email contact non envoyée : {}", e.getMessage());
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("message", "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.");
        return ResponseEntity.ok(res);
    }
}
