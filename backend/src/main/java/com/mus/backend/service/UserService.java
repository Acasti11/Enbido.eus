package com.mus.backend.service;

import com.mus.backend.dto.UsuarioRegistroDto;
import com.mus.backend.model.Usuario;
import com.mus.backend.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Usuario> findAll() {
        return usuarioRepository.findAll();
    }

    public Optional<Usuario> findById(Long id) {
        return usuarioRepository.findById(id);
    }

    public boolean existsById(Long id) {
        return usuarioRepository.existsById(id);
    }

    public void deleteById(Long id) {
        usuarioRepository.deleteById(id);
    }

    public Usuario registrarUsuario(UsuarioRegistroDto dto) {
        if (usuarioRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        Usuario usuario = new Usuario();
        usuario.setName(dto.getName());
        usuario.setSurname(dto.getSurname());
        usuario.setEmail(dto.getEmail());
        usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        usuario.setPhoneNumber(dto.getPhoneNumber());
        usuario.setPostalCode(dto.getPostalCode());
        usuario.setBirthDate(dto.getBirthDate());
        usuario.setUsername(dto.getUsername());
        usuario.setRole("user");
        usuario.setIsBanned(false);

        return usuarioRepository.save(usuario);
    }

    public Usuario updateUsuario(Long id, Usuario usuarioDetails) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        usuario.setName(usuarioDetails.getName());
        usuario.setSurname(usuarioDetails.getSurname());
        usuario.setEmail(usuarioDetails.getEmail());
        usuario.setPhoneNumber(usuarioDetails.getPhoneNumber());
        usuario.setPostalCode(usuarioDetails.getPostalCode());
        usuario.setBirthDate(usuarioDetails.getBirthDate());
        usuario.setUsername(usuarioDetails.getUsername());
        usuario.setRole(usuarioDetails.getRole());
        usuario.setIsBanned(usuarioDetails.getIsBanned());

        return usuarioRepository.save(usuario);
    }

    public Usuario authenticate(String username, String rawPassword) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(rawPassword, usuario.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return usuario;
    }
}