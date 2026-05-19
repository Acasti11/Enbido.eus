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

    public Usuario crearUsuario(Usuario u) {
        u.setPassword(passwordEncoder.encode(u.getPassword()));
        return usuarioRepository.save(u);
    }

    public boolean verificarLogin(String passwordPlano, String hashDeBaseDatos) {
        return passwordEncoder.matches(passwordPlano, hashDeBaseDatos);
    }
}