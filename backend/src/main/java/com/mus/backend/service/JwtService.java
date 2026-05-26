package com.mus.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {
    
    @Value("${jwt.secret}")
    private String secret;
    
    @Value("${jwt.expiration:900000}") // 15 min
    private long expiration;
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // ============================================
    // Generar token: solo userId + username + role
    // ============================================
    public String generateToken(Long userId, String username, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
            .subject(String.valueOf(userId))      // sub = userId (para operar)
            .claim("username", username)           // solo para mostrar
            .claim("role", role)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(getSigningKey())
            .compact();
    }

    // ============================================
    // Validar y extraer claims
    // ============================================
    public Claims validateToken(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            return !validateToken(token).getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // Extraer userId (el sub) - ESTO es lo que usas para todo
    public Long extractUserId(String token) {
        String sub = validateToken(token).getSubject();
        return Long.valueOf(sub);
    }

    // Extraer username - solo para mostrar, NUNCA para operar
    public String extractUsername(String token) {
        return validateToken(token).get("username", String.class);
    }

    public String extractRole(String token) {
        return validateToken(token).get("role", String.class);
    }
}