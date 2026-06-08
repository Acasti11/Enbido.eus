package com.mus.backend.service;

import com.mus.backend.model.RefreshToken;
import com.mus.backend.model.User;
import com.mus.backend.repository.RefreshTokenRepository;
import com.mus.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    /**
     * Crea un nuevo refresh token para el usuario y lo almacena hasheado en BD.
     * Devuelve el token en texto plano (solo se muestra una vez).
     */
    @Transactional
    public String createRefreshToken(User user) {
        // Eliminar tokens previos del usuario
        refreshTokenRepository.deleteByUser_UserId(user.getUserId());

        String plainToken = generatePlainToken();
        String tokenHash = hashToken(plainToken);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(tokenHash);
        refreshToken.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);
        return plainToken;
    }

    /**
     * Valida un refresh token. Si es válido, devuelve el usuario asociado.
     * Si es inválido o expirado, lanza RuntimeException.
     */
    @Transactional(readOnly = true)
    public User validateRefreshToken(String plainToken) {
        String tokenHash = hashToken(plainToken);
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (refreshToken.isRevoked()) {
            throw new RuntimeException("Refresh token revoked");
        }

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Refresh token expired");
        }

        return refreshToken.getUser();
    }

    /**
     * Valida un refresh token, lo revoca y crea uno nuevo (rotación).
     * Devuelve el nuevo token en texto plano.
     */
    @Transactional
    public String rotateRefreshToken(String plainToken) {
        User user = validateRefreshToken(plainToken);

        // Revocar el token anterior
        String oldHash = hashToken(plainToken);
        refreshTokenRepository.findByTokenHash(oldHash).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });

        return createRefreshToken(user);
    }

    /**
     * Revoca un refresh token (logout).
     */
    @Transactional
    public void revokeRefreshToken(String plainToken) {
        String tokenHash = hashToken(plainToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }

    private String generatePlainToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[64];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String plainToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(plainToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
