package com.poly.dindor.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_attempts", indexes = {
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_created_at", columnList = "createdAt"),
    @Index(name = "idx_ip_address", columnList = "ipAddress")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttempt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String email;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean success = false;
    
    @Column(length = 45)
    private String ipAddress;
    
    @Column(length = 500)
    private String userAgent;
    
    @Column(length = 500)
    private String failureReason;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
