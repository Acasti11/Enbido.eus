package com.mus.backend.service;

import com.mus.backend.model.Usuario;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.repository.UsuarioRepository;
import com.mus.backend.repository.UserGameProfileRepository;
import com.mus.backend.service.JwtService;
import com.mus.backend.dto.UserRegisterDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class UserService {

    private final UsuarioRepository usuarioRepository;
    private final UserGameProfileRepository userGameProfileRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public UserService(UsuarioRepository usuarioRepository,
                       UserGameProfileRepository userGameProfileRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.userGameProfileRepository = userGameProfileRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    // ============================================
    // REGISTRO: crea usuario + perfil de juego
    // ============================================
    public String registrarUsuario(UserRegisterDto dto) {
        if (usuarioRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Username ya existe");
        }
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email ya existe");
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(dto.getUsername());
        usuario.setName(dto.getName());
        usuario.setSurname(dto.getSurname());
        usuario.setEmail(dto.getEmail());
        usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        usuario.setPhoneNumber(dto.getPhoneNumber());
        usuario.setBirthDate(dto.getBirthDate());
        usuario.setPostalCode(dto.getPostalCode());
        usuario.setRole("USER");
        usuario.setIsBanned(false);
        usuario.setCreatedAt(LocalDateTime.now());

        Usuario savedUser = usuarioRepository.save(usuario);

        // Crear perfil de juego con monedas iniciales
        UserGameProfile profile = new UserGameProfile(savedUser.getUserId());
        userGameProfileRepository.save(profile);

        return "Usuario registrado correctamente";
    }

    // ============================================
    // LOGIN: devuelve SOLO el token
    // ============================================
    public String authenticate(String username, String password) {
        Usuario usuario = usuarioRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            throw new RuntimeException("Credenciales inválidas");
        }

        if (usuario.getIsBanned()) {
            throw new RuntimeException("Usuario baneado");
        }

        return jwtService.generateToken(
            usuario.getUserId(),
            usuario.getUsername(),
            usuario.getRole()
        );
    }
}