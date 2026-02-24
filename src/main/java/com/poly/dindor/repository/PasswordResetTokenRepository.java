package com.poly.dindor.repository;

import com.poly.dindor.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    Optional<PasswordResetToken> findByToken(String token);
    
    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.expiresAt < :now")
    void deleteExpiredTokens(LocalDateTime now);
    
    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.admin.id = :adminId")
    void deleteByAdminId(Long adminId);
}
