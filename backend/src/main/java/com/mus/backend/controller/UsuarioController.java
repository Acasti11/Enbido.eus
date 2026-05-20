package com.mus.backend.controller;

import com.mus.backend.model.Usuario;
import com.mus.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.mus.backend.service.UserService;
import com.mus.backend.model.LoginRequest;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private UserService userService;
        @Autowired
    private com.mus.backend.repository.UserGameProfileRepository

    // GET todos los usuarios
    @GetMapping
    public List<Usuario> getAllUsuarios() {
        return usuarioRepository.findAll();
    }

    // GET un usuario por ID
    @GetMapping("/{id}")
    public ResponseEntity<Usuario> getUsuarioById(@PathVariable Long id) {
        Optional<Usuario> usuario = usuarioRepository.findById(id);
        return usuario.map(ResponseEntity::ok)
                      .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // POST crear usuario
    @PostMapping
    public ResponseEntity<?> createUsuario(@RequestBody Usuario usuario) {
        if (usuarioRepository.existsByUsername(usuario.getUsername())) {
            return ResponseEntity.badRequest().body("El username ya existe");
        }
        
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            return ResponseEntity.badRequest().body("El email ya existe");
        }

        Usuario saved = userService.crearUsuario(usuario);
        try {
            com.mus.backend.model.UserGameProfile profile = new com.mus.backend.model.UserGameProfile(saved.getUserId());
            userGameProfileRepository.save(profile);
        } catch (Exception e) {
            System.err.println("Error al inicializar el perfil del usuario: " + e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // PUT actualizar usuario
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUsuario(@PathVariable Long id, @RequestBody Usuario usuarioDetails) {
        Optional<Usuario> optionalUsuario = usuarioRepository.findById(id);
        
        if (optionalUsuario.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Usuario usuario = optionalUsuario.get();
        usuario.setName(usuarioDetails.getName());
        usuario.setSurname(usuarioDetails.getSurname());
        usuario.setEmail(usuarioDetails.getEmail());
        usuario.setPassword(usuarioDetails.getPassword());
        usuario.setPhoneNumber(usuarioDetails.getPhoneNumber());
        usuario.setPostalCode(usuarioDetails.getPostalCode());
        usuario.setUsername(usuarioDetails.getUsername());
        usuario.setRole(usuarioDetails.getRole());
        usuario.setIsBanned(usuarioDetails.getIsBanned());

        Usuario updated = usuarioRepository.save(usuario);
        return ResponseEntity.ok(updated);
    }

    // DELETE eliminar usuario
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUsuario(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        usuarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // POST login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<Usuario> usuario = usuarioRepository.findByUsername(request.getUsername());
        
        if (usuario.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado");
        }

        if (!userService.verificarLogin(request.getPassword(),usuario.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Contraseña incorrecta");
        }

        return ResponseEntity.ok(usuario.get());
    }
}