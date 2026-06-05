package com.mus.backend.controller;

import com.mus.backend.dto.AuthResponse;
import com.mus.backend.dto.GoogleLoginRequest;
import com.mus.backend.dto.LoginRequest;
import com.mus.backend.service.AuthService;
import com.mus.backend.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    // ============================================================
    // PUBLIC: Traditional login (email + password)
    // ============================================================
    @PostMapping("/login")
    public ResponseEntity<?> loginTraditional(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.loginTraditional(
                    request.getEmail(),
                    request.getPassword()
            );
            return ResponseEntity.ok(response);
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
    // ============================================================
    @PostMapping("/google")
    public ResponseEntity<?> loginGoogle(@RequestBody GoogleLoginRequest request) {
        try {
            AuthResponse response = authService.loginGoogle(request.getIdToken());
            return ResponseEntity.ok(response);
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
    // HELPER: extract userId from request attribute
    // ============================================================
    private Long getCurrentUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Not authenticated");
        }
        return userId;
    }
}
