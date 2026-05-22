package com.mus.backend.service;

import com.mus.backend.model.Usuario;
import com.mus.backend.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final PasswordEncoder passwordEncoder;
    private final UsuarioRepository usuarioRepository;

    public UserService(PasswordEncoder passwordEncoder, UsuarioRepository usuarioRepository) {
        this.passwordEncoder = passwordEncoder;
        this.usuarioRepository = usuarioRepository;
    }

    public Usuario registrarUsuario(Usuario usuario) {
        if (usuarioRepository.existsByUsername(usuario.getUsername())) {
            throw new IllegalArgumentException("El username ya existe");
        }
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new IllegalArgumentException("El email ya existe");
        }

        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));

        Usuario saved = usuarioRepository.save(usuario);

        try {
            UserGameProfile profile = new UserGameProfile(saved.getUserId());
            userGameProfileRepository.save(profile);
        } catch (Exception e) {
            System.err.println("Error al inicializar el perfil: " + e.getMessage());
        }

        return saved;
    }

    public boolean verificarLogin(String passwordPlano, String hashDeBaseDatos) {
        return passwordEncoder.matches(passwordPlano, hashDeBaseDatos);
    }
}