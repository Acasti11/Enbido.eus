package com.mus.backend.controller;

import com.mus.backend.model.Usuario;
import com.mus.backend.repository.UsuarioRepository;
import com.mus.backend.service.UserService;
import com.mus.backend.model.LoginRequest;
import com.mus.backend.dto.UserRegisterDto;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private UserService userService;

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
        }
    }

    // ============================================
    // PÚBLICO: Login (sin token → devuelve token)
    // ============================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String token = userService.authenticate(
                request.getUsername(), 
                request.getPassword()
            );
            return ResponseEntity.ok(Map.of(
                "accessToken", token,
                "tokenType", "Bearer",
                "expiresIn", 86400
            ));
        } catch (RuntimeException e) {
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
        
        Usuario usuario = usuarioRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        usuario.setPassword(null);
        return ResponseEntity.ok(usuario);
    }

    // ============================================
    // PROTEGIDO: Actualizar MI perfil (del token)
    // ============================================
    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(@RequestBody Usuario datos, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        
        Usuario usuario = usuarioRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setName(datos.getName());
        usuario.setSurname(datos.getSurname());
        usuario.setPhoneNumber(datos.getPhoneNumber());
        usuario.setPostalCode(datos.getPostalCode());
        
        Usuario updated = usuarioRepository.save(usuario);
        updated.setPassword(null);
        return ResponseEntity.ok(updated);
    }

    // ============================================
    // PROTEGIDO: Eliminar MI cuenta (del token)
    // ============================================
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        usuarioRepository.deleteById(userId);
        return ResponseEntity.noContent().build();
    }

    // ============================================
    // ADMIN: Listar todos (protegido por rol)
    // ============================================
    @GetMapping
    public ResponseEntity<?> getAllUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        usuarios.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(usuarios);
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