package com.mus.backend.controller;

import com.mus.backend.model.User;
import com.mus.backend.repository.UserRepository;
import com.mus.backend.service.UserService;
import com.mus.backend.service.JwtService;
import com.mus.backend.service.RefreshTokenService;
import com.mus.backend.util.CookieUtil;
import com.mus.backend.model.LoginRequest;
import com.mus.backend.dto.UserRegisterDto;
import com.mus.backend.dto.LoginResponseDto;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private CookieUtil cookieUtil;

    // ============================================
    // PÚBLICO: Registro (sin token)
    // ============================================
    @PostMapping
    public ResponseEntity<?> createUsuario(@Valid @RequestBody UserRegisterDto dto) {
        try {
            String mensaje = userService.registrarUsuario(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of("message", mensaje)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                Map.of("error", e.getMessage())
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("error", e.getClass().getSimpleName() + ": " + e.getMessage())
            );
        }
    }

    // ============================================
    // PÚBLICO: Login (sin token → maneja Doble Factor)
    // Sets cookies on successful login (no 2FA)
    // ============================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        try {
            LoginResponseDto loginResponse = userService.authenticate(
                request.getUsername(), 
                request.getPassword()
            );

            if (loginResponse.isTwoFactorRequired()) {
                return ResponseEntity.ok(loginResponse);
            }

            // Login exitoso sin 2FA: setear cookies
            User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

            setAuthCookies(response, user);
            return ResponseEntity.ok(loginResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of("error", e.getMessage())
            );
        }
    }

    // ============================================
    // PÚBLICO: Verificar código 2FA
    // Sets cookies after successful verification
    // ============================================
    @PostMapping("/login/verify-2fa")
    public ResponseEntity<?> verify2Fa(@RequestBody Map<String, Object> body, HttpServletResponse response) {
        try {
            Long userId = Long.valueOf(body.get("userId").toString());
            String code = (String) body.get("code");
            
            userService.verify2Fa(userId, code);
            
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            setAuthCookies(response, user);
            return ResponseEntity.ok(Map.of("message", "2FA verified successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of("error", e.getMessage())
            );
        }
    }

    // ============================================
    // PÚBLICO: Solicitar recuperación de contraseña
    // ============================================
    @PostMapping("/login/recover-password")
    public ResponseEntity<?> recoverPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String frontendUrl = body.get("frontendUrl");
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El correo electrónico es obligatorio"));
            }
            if (frontendUrl == null || frontendUrl.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "La URL de redirección es obligatoria"));
            }
            
            userService.requestPasswordReset(email.trim(), frontendUrl.trim());
            return ResponseEntity.ok(Map.of("message", "Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // ============================================
    // PÚBLICO: Restablecer contraseña con token
    // ============================================
    @PostMapping("/login/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String token = body.get("token");
            String newPassword = body.get("newPassword");
            if (token == null || token.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El token es obligatorio"));
            }
            if (newPassword == null || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "La nueva contraseña es obligatoria"));
            }
            
            userService.resetPassword(token.trim(), newPassword.trim());
            return ResponseEntity.ok(Map.of("message", "Tu contraseña ha sido restablecida con éxito"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // ============================================
    // PROTEGIDO: Obtener MI perfil
    // ============================================
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        return ResponseEntity.ok(user);
    }

    // ============================================
    // PROTEGIDO: Actualizar MI perfil
    // ============================================
    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(@RequestBody User datos, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        user.setName(datos.getName());
        user.setSurname(datos.getSurname());
        user.setPhoneNumber(datos.getPhoneNumber());
        user.setPostalCode(datos.getPostalCode());
        
        User updated = userRepository.save(user);
        return ResponseEntity.ok(updated);
    }

    // ============================================
    // PROTEGIDO: Eliminar MI cuenta
    // ============================================
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        userRepository.deleteById(userId);
        return ResponseEntity.noContent().build();
    }

    // ============================================
    // ADMIN: Listar todos
    // ============================================
    @GetMapping
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<?> getAllUsuarios() {
        List<User> usuarios = userRepository.findAll();
        return ResponseEntity.ok(usuarios);
    }

    // ============================================
    // ADMIN: Banear usuario
    // ============================================
    @PostMapping("/{id}/ban")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<?> banUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setIsBanned(true);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Usuario baneado correctamente"));
    }

    // ============================================
    // ADMIN: Desbanear usuario
    // ============================================
    @PostMapping("/{id}/unban")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<?> unbanUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setIsBanned(false);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Usuario desbaneado correctamente"));
    }

    // ============================================
    // PROTEGIDO: Buscar usuarios por username (para añadir amigos)
    // ============================================
    @GetMapping("/search")
    public ResponseEntity<?> searchUsuarios(@RequestParam String query, HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        List<User> allUsers = userRepository.findAll();
        List<Map<String, Object>> results = allUsers.stream()
            .filter(u -> u.getUsername().toLowerCase().contains(query.toLowerCase()))
            .filter(u -> !u.getUserId().equals(currentUserId))
            .map(u -> {
                Map<String, Object> map = new HashMap<>();
                map.put("userId", u.getUserId());
                map.put("username", u.getUsername());
                map.put("name", u.getName());
                map.put("surname", u.getSurname());
                map.put("profilePicture", u.getProfilePicture());
                return map;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }

    // ============================================
    // PROTEGIDO: Activar/Desactivar 2FA
    // ============================================
    @PostMapping("/me/2fa/toggle")
    public ResponseEntity<?> toggle2Fa(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            Boolean enabled = (Boolean) body.get("enabled");
            if (enabled == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El campo 'enabled' es obligatorio"));
            }

            boolean updatedStatus = userService.toggle2Fa(userId, enabled);

            return ResponseEntity.ok(Map.of(
                "message", "Doble Factor (2FA) actualizado con éxito",
                "twoFactorEnabled", updatedStatus
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of("error", e.getMessage())
            );
        }
    }

    // ============================================
    // EXCEPTION HANDLER
    // ============================================
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.toList());
        
        return ResponseEntity.badRequest().body(
            Map.of("error", "Validation failed", "details", errors)
        );
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeExceptions(RuntimeException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Unknown error";
        if ("No autenticado".equals(message)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of("error", message)
            );
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            Map.of("error", message)
        );
    }

    // ============================================
    // HELPERS
    // ============================================
    private Long getCurrentUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("No autenticado");
        }
        return userId;
    }

    private void setAuthCookies(HttpServletResponse response, User user) {
        String accessToken = jwtService.generateToken(
                user.getUserId(),
                user.getUsername(),
                user.getRole().name()
        );
        cookieUtil.addAccessTokenCookie(response, accessToken, jwtService.getExpirationMillis(accessToken) - System.currentTimeMillis());

        String refreshToken = refreshTokenService.createRefreshToken(user);
        cookieUtil.addRefreshTokenCookie(response, refreshToken);
    }
}
