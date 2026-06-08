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
import jakarta.servlet.http.Cookie;
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
    private final CookieUtil cookieUtil;

    public AuthController(AuthService authService,
                          JwtService jwtService,
                          RefreshTokenService refreshTokenService,
                          TokenBlacklistService tokenBlacklistService,
                          CookieUtil cookieUtil) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.cookieUtil = cookieUtil;
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
        // DEBUG: Log all incoming cookies
        System.out.println("=== REFRESH TOKEN DEBUG ===");
        System.out.println("Request URI: " + request.getRequestURI());
        System.out.println("Request Origin: " + request.getHeader("Origin"));

        String refreshToken = CookieUtil.extractCookieValue(request, "refresh_token");
        System.out.println("refresh_token from CookieUtil: " + (refreshToken != null ? "present (len=" + refreshToken.length() + ")" : "NULL"));

        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            System.out.println("Total cookies received: " + cookies.length);
            for (Cookie c : cookies) {
                String valuePreview = c.getValue() != null
                        ? c.getValue().substring(0, Math.min(20, c.getValue().length())) + "..."
                        : "null";
                System.out.println("  Cookie: " + c.getName() + " = " + valuePreview
                        + " [path=" + c.getPath() + ", httpOnly=" + c.isHttpOnly() + "]");
            }
        } else {
            System.out.println("NO cookies received in request!");
        }
        System.out.println("===========================");

        if (refreshToken == null) {
            System.out.println("[REFRESH] Rejected: no refresh_token cookie found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No refresh token"));
        }

        try {
            User user = refreshTokenService.validateRefreshToken(refreshToken);
            System.out.println("[REFRESH] Token validated for user: " + user.getUsername());

            // Rotate refresh token
            String newRefreshToken = refreshTokenService.rotateRefreshToken(refreshToken);
            System.out.println("[REFRESH] Token rotated successfully");

            // Generate new access token
            String newAccessToken = jwtService.generateToken(
                    user.getUserId(),
                    user.getUsername(),
                    user.getRole().name()
            );

            cookieUtil.addAccessTokenCookie(response, newAccessToken, jwtService.getExpirationMillis(newAccessToken) - System.currentTimeMillis());
            cookieUtil.addRefreshTokenCookie(response, newRefreshToken);

            System.out.println("[REFRESH] New cookies set, returning 200 OK");
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            System.out.println("[REFRESH] Failed: " + e.getMessage());
            cookieUtil.clearAccessTokenCookie(response);
            cookieUtil.clearRefreshTokenCookie(response);
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

        cookieUtil.clearAccessTokenCookie(response);
        cookieUtil.clearRefreshTokenCookie(response);

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
        cookieUtil.addAccessTokenCookie(response, accessToken, jwtService.getExpirationMillis(accessToken) - System.currentTimeMillis());

        User userEntity = new User();
        userEntity.setUserId(user.getId());
        userEntity.setUsername(user.getUsername());
        userEntity.setRole(User.Role.valueOf(user.getRole()));
        String refreshToken = refreshTokenService.createRefreshToken(userEntity);
        cookieUtil.addRefreshTokenCookie(response, refreshToken);
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Not authenticated");
        }
        return userId;
    }
}
