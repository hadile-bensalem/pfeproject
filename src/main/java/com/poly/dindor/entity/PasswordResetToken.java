package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens", indexes = {
    @Index(name = "idx_token", columnList = "token"),
    @Index(name = "idx_expires_at", columnList = "expiresAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 255)
    private String token;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "admin_id")
    private Admin admin;
    
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean used = false;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer attempts = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer maxAttempts = 3;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    public boolean isExpired() {
        return expiresAt.isBefore(LocalDateTime.now());
    }
    
    public boolean isValid() {
        return !used && !isExpired() && attempts < maxAttempts;
    }
    
    public void incrementAttempts() {
        this.attempts++;
    }
    
    public void markAsUsed() {
        this.used = true;
    }
}
