package com.poly.dindor.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    
    @Value("${app.jwt.secret}")
    private String secret;
    
    @Value("${app.jwt.expiration}")
    private Long expiration;
    
    @Value("${app.jwt.refresh-expiration}")
    private Long refreshExpiration;
    
    public Long getExpiration() {
        return expiration;
    }
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
    
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    public Long extractAdminId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("adminId", Long.class);
    }
    
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
    
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    public String generateToken(Long adminId, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("adminId", adminId);
        return createToken(claims, email, expiration);
    }
    
    public String generateRefreshToken(Long adminId, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("adminId", adminId);
        claims.put("type", "refresh");
        return createToken(claims, email, refreshExpiration);
    }
    
    private String createToken(Map<String, Object> claims, String subject, Long expirationTime) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationTime);
        
        return Jwts.builder()
            .claims(claims)
            .subject(subject)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(getSigningKey())
            .compact();
    }
    
    public Boolean validateToken(String token, String email) {
        try {
            final String tokenEmail = extractEmail(token);
            return (tokenEmail.equals(email) && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }
    
    public Boolean isRefreshToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return "refresh".equals(claims.get("type"));
        } catch (Exception e) {
            return false;
        }
    }
}
