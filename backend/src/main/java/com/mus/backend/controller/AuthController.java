package com.mus.backend.controller;

import com.mus.backend.dto.GoogleLoginRequest;
import com.mus.backend.dto.LoginRequest;
import com.mus.backend.dto.UserDTO;
import com.mus.backend.model.User;
import com.mus.backend.service.AuthService;
import com.mus.backend.service.JwtService;
import com.mus.backend.service.RefreshTokenService;
import com.mus.backend.service.TokenBlacklistService;
import com.mus.backend.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthController(AuthService authService,
                          JwtService jwtService,
                          RefreshTokenService refreshTokenService,
                          TokenBlacklistService tokenBlacklistService) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    // ============================================================
    // PUBLIC: Traditional login (email + password)
    // Sets HttpOnly cookies, returns user data only
    // ============================================================
    @PostMapping("/login")
    public ResponseEntity<?> loginTraditional(@RequestBody LoginRequest request,
                                               HttpServletResponse response) {
        try {
            UserDTO user = authService.loginTraditional(request.getEmail(), request.getPassword());
            setAuthCookies(response, user);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            String message = e.getMessage();
            if ("User is banned".equals(message)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", message));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", message));
        }
    }

    // ============================================================
    // PUBLIC: Google OAuth login
    // Sets HttpOnly cookies, returns user data only
    // ============================================================
    @PostMapping("/google")
    public ResponseEntity<?> loginGoogle(@RequestBody GoogleLoginRequest request,
                                          HttpServletResponse response) {
        try {
            UserDTO user = authService.loginGoogle(request.getIdToken());
            setAuthCookies(response, user);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            String message = e.getMessage();
            if ("User is banned".equals(message)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", message));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", message));
        }
    }

    // ============================================================
    // PUBLIC: Refresh access token using refresh token cookie
    // ============================================================
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = CookieUtil.extractCookieValue(request, "refresh_token");
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No refresh token"));
        }

        try {
            User user = refreshTokenService.validateRefreshToken(refreshToken);

            // Rotate refresh token
            String newRefreshToken = refreshTokenService.rotateRefreshToken(refreshToken);

            // Generate new access token
            String newAccessToken = jwtService.generateToken(
                    user.getUserId(),
                    user.getUsername(),
                    user.getRole().name()
            );

            CookieUtil.addAccessTokenCookie(response, newAccessToken, jwtService.getExpirationMillis(newAccessToken) - System.currentTimeMillis());
            CookieUtil.addRefreshTokenCookie(response, newRefreshToken);

            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            CookieUtil.clearAccessTokenCookie(response);
            CookieUtil.clearRefreshTokenCookie(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ============================================================
    // PUBLIC: Logout - invalidate tokens and clear cookies
    // ============================================================
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        String accessToken = CookieUtil.extractCookieValue(request, "access_token");
        String refreshToken = CookieUtil.extractCookieValue(request, "refresh_token");

        // Blacklist access token until its expiration
        if (accessToken != null && jwtService.isTokenValid(accessToken)) {
            try {
                long ttl = jwtService.getExpirationMillis(accessToken) - System.currentTimeMillis();
                if (ttl > 0) {
                    tokenBlacklistService.blacklist(accessToken, ttl);
                }
            } catch (Exception e) {
                // Token invalid, ignore
            }
        }

        // Revoke refresh token
        if (refreshToken != null) {
            try {
                refreshTokenService.revokeRefreshToken(refreshToken);
            } catch (Exception e) {
                // Ignore
            }
        }

        CookieUtil.clearAccessTokenCookie(response);
        CookieUtil.clearRefreshTokenCookie(response);

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    // ============================================================
    // PROTECTED: Link Google account to existing user
    // ============================================================
    @PostMapping("/link-google")
    public ResponseEntity<?> linkGoogleAccount(@RequestBody GoogleLoginRequest request,
                                                HttpServletRequest httpRequest) {
        try {
            Long userId = getCurrentUserId(httpRequest);
            authService.linkGoogleAccount(userId, request.getIdToken());
            return ResponseEntity.ok(Map.of("message", "Google account linked successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ============================================================
    // HELPERS
    // ============================================================
    private void setAuthCookies(HttpServletResponse response, UserDTO user) {
        String accessToken = jwtService.generateToken(
                user.getId(),
                user.getUsername(),
                user.getRole()
        );
        CookieUtil.addAccessTokenCookie(response, accessToken, jwtService.getExpirationMillis(accessToken) - System.currentTimeMillis());

        User userEntity = new User();
        userEntity.setUserId(user.getId());
        userEntity.setUsername(user.getUsername());
        userEntity.setRole(User.Role.valueOf(user.getRole()));
        String refreshToken = refreshTokenService.createRefreshToken(userEntity);
        CookieUtil.addRefreshTokenCookie(response, refreshToken);
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Not authenticated");
        }
        return userId;
    }
}
