package com.tuprojecto.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final PasswordEncoder passwordEncoder;
    private final UsuarioRepository usuarioRepository;

    // Spring inyecta el Bean automáticamente
    public UserService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public void crearUsuario(Usuario u) {
        u.password = passwordEncoder.encode(u.passwordEncoder);
        Usuario saved =usuarioRepository.save(u);
        return saved;
    }

    public boolean verificarLogin(String passwordPlano, String hashDeBaseDatos) {
        return passwordEncoder.matches(passwordPlano, hashDeBaseDatos);
    }
}