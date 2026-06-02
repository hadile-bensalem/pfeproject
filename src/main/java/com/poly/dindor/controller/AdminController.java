package com.poly.dindor.controller;

import com.poly.dindor.dto.response.ApiResponse;
import com.poly.dindor.dto.response.AuthResponse;
import com.poly.dindor.entity.Admin;
import com.poly.dindor.entity.ContactMessage;
import com.poly.dindor.exception.ResourceNotFoundException;
import com.poly.dindor.repository.AdminRepository;
import com.poly.dindor.repository.ContactMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminRepository          adminRepository;
    private final ContactMessageRepository contactMessageRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.AdminInfo>> getCurrentAdmin(Authentication authentication) {
        String email = authentication.getName();
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin introuvable"));
        AuthResponse.AdminInfo adminInfo = AuthResponse.AdminInfo.builder()
                .id(admin.getId())
                .email(admin.getEmail())
                .firstName(admin.getFirstName())
                .lastName(admin.getLastName())
                .build();
        return ResponseEntity.ok(ApiResponse.success(adminInfo));
    }

    // ── Messages de contact ────────────────────────────────────────────────

    @GetMapping("/contact-messages")
    public ResponseEntity<ApiResponse<List<ContactMessage>>> getContactMessages() {
        List<ContactMessage> messages = contactMessageRepository.findAllByOrderByDateEnvoiDesc();
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/contact-messages/nonlus")
    public ResponseEntity<ApiResponse<List<ContactMessage>>> getMessagesNonLus() {
        List<ContactMessage> nonLus = contactMessageRepository.findAllByOrderByDateEnvoiDesc()
                .stream().filter(m -> !Boolean.TRUE.equals(m.getLu())).toList();
        return ResponseEntity.ok(ApiResponse.success(nonLus));
    }

    @PatchMapping("/contact-messages/{id}/lu")
    public ResponseEntity<ApiResponse<Void>> marquerLu(@PathVariable Long id) {
        ContactMessage msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message introuvable"));
        msg.setLu(true);
        contactMessageRepository.save(msg);
        return ResponseEntity.ok(ApiResponse.success("Message marqué comme lu", null));
    }

    @DeleteMapping("/contact-messages/{id}")
    public ResponseEntity<ApiResponse<Void>> supprimerMessage(@PathVariable Long id) {
        if (!contactMessageRepository.existsById(id)) {
            throw new ResourceNotFoundException("Message introuvable");
        }
        contactMessageRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Message supprimé", null));
    }
}
