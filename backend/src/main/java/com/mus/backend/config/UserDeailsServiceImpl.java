package com.mus.backend.security;

import com.mus.backend.model.Usuario;
import com.mus.backend.repository.UsuarioRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    
    private final UsuarioRepository usuarioRepository;
    
    public UserDetailsServiceImpl(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
        
        return new User(
            usuario.getUsername(),
            usuario.getPassword(),
            usuario.getIsBanned() ? false : true,  // enabled
            true,  // accountNonExpired
            true,  // credentialsNonExpired
            usuario.getIsBanned() ? false : true,  // accountNonLocked
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + usuario.getRole()))
        );
    }
}