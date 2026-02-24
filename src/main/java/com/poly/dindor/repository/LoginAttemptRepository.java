package com.poly.dindor.repository;

import com.poly.dindor.entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    
    @Query("SELECT COUNT(l) FROM LoginAttempt l WHERE l.email = :email AND l.success = false AND l.createdAt > :since")
    long countFailedAttemptsSince(@Param("email") String email, @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(l) FROM LoginAttempt l WHERE l.ipAddress = :ipAddress AND l.success = false AND l.createdAt > :since")
    long countFailedAttemptsByIpSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);
    
    List<LoginAttempt> findByEmailOrderByCreatedAtDesc(String email);
    
    @Query("SELECT l FROM LoginAttempt l WHERE l.createdAt > :since ORDER BY l.createdAt DESC")
    List<LoginAttempt> findRecentAttempts(@Param("since") LocalDateTime since);
}
