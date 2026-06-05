package com.mus.backend.controller;

import com.mus.backend.model.User;
import com.mus.backend.repository.UserRepository;
import com.mus.backend.service.UserService;
import com.mus.backend.model.LoginRequest;
import com.mus.backend.dto.UserRegisterDto;
import com.mus.backend.dto.LoginResponseDto;
import com.mus.backend.repository.UserGameProfileRepository;
import com.mus.backend.model.UserGameProfile;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserService userService;

    @Autowired
    private UserGameProfileRepository userGameProfileRepository;

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
    // ============================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponseDto response = userService.authenticate(
                request.getUsername(), 
                request.getPassword()
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of("error", e.getMessage())
            );
        }
    }

    // ============================================
    // PÚBLICO: Verificar código 2FA
    // ============================================
    @PostMapping("/login/verify-2fa")
    public ResponseEntity<?> verify2Fa(@RequestBody Map<String, Object> body) {
        try {
            Long userId = Long.valueOf(body.get("userId").toString());
            String code = (String) body.get("code");
            
            String token = userService.verify2Fa(userId, code);
            
            return ResponseEntity.ok(new LoginResponseDto(false, null, token));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                Map.of("error", e.getMessage())
            );
        }
    }

    // ============================================
    // PROTEGIDO: Obtener MI perfil (del token)
    // ============================================
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        return ResponseEntity.ok(user);
    }

    // ============================================
    // PROTEGIDO: Actualizar MI perfil (del token)
    // ============================================
    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(@RequestBody User datos, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        boolean isBirthDateSetFirstTime = (user.getBirthDate() == null && datos.getBirthDate() != null);

        user.setName(datos.getName());
        user.setSurname(datos.getSurname());
        user.setPhoneNumber(datos.getPhoneNumber());
        user.setPostalCode(datos.getPostalCode());
        if (datos.getBirthDate() != null) {
            user.setBirthDate(datos.getBirthDate());
        }
        
        User updated = userRepository.save(user);

        if (isBirthDateSetFirstTime) {
            UserGameProfile profile = userGameProfileRepository.findById(userId)
                .orElseGet(() -> new UserGameProfile(userId));
            int age = java.time.LocalDate.now().getYear() - updated.getBirthDate().getYear();
            int elo = (int) Math.round(1000.5769 + 30.0668 * age - 0.26948 * age * age);
            elo = Math.max(500, Math.min(2000, elo));
            profile.setElo(elo);
            userGameProfileRepository.save(profile);
        }

        return ResponseEntity.ok(updated);
    }

    // ============================================
    // PROTEGIDO: Eliminar MI cuenta (del token)
    // ============================================
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        userRepository.deleteById(userId);
        return ResponseEntity.noContent().build();
    }

    // ============================================
    // ADMIN: Listar todos (protegido por rol)
    // ============================================
    @GetMapping
    public ResponseEntity<?> getAllUsuarios() {
        List<User> usuarios = userRepository.findAll();
        return ResponseEntity.ok(usuarios);
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
    // PÚBLICO: Solicitar recuperación de contraseña (sin token)
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
    // PÚBLICO: Restablecer contraseña con token (sin token)
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
    // EXCEPTION HANDLER: Validation errors (@Valid)
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

    // ============================================
    // HELPER: extrae userId del request attribute
    // Lo guarda JwtInterceptor al validar token
    // ============================================
    private Long getCurrentUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("No autenticado");
        }
        return userId;
    }
}
