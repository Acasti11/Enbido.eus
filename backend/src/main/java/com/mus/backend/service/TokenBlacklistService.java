package com.mus.backend.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    /**
     * Añade un token a la blacklist con un TTL en milisegundos.
     * El token se eliminará automáticamente de la blacklist cuando expire.
     */
    public void blacklist(String token, long ttlMillis) {
        if (ttlMillis > 0) {
            blacklistedTokens.put(token, System.currentTimeMillis() + ttlMillis);
        }
    }

    /**
     * Verifica si un token está en la blacklist.
     * También limpia tokens expirados de forma lazy.
     */
    public boolean isBlacklisted(String token) {
        Long expiry = blacklistedTokens.get(token);
        if (expiry == null) {
            return false;
        }
        if (System.currentTimeMillis() > expiry) {
            blacklistedTokens.remove(token);
            return false;
        }
        return true;
    }

    /**
     * Limpieza manual de tokens expirados.
     */
    public void cleanupExpired() {
        long now = System.currentTimeMillis();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue() < now);
    }
}
