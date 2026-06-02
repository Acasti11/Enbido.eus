package com.mus.backend.service;

import com.mus.backend.model.Usuario;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.repository.UsuarioRepository;
import com.mus.backend.repository.UserGameProfileRepository;
import com.mus.backend.dto.UserRegisterDto;
import com.mus.backend.dto.LoginResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class UserService {

    private final UsuarioRepository usuarioRepository;
    private final UserGameProfileRepository userGameProfileRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    public UserService(UsuarioRepository usuarioRepository,
                       UserGameProfileRepository userGameProfileRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       MailService mailService) {
        this.usuarioRepository = usuarioRepository;
        this.userGameProfileRepository = userGameProfileRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
    }

    // ============================================
    // REGISTRO: crea usuario + perfil de juego
    // ============================================
    @Transactional
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
    // LOGIN: maneja Doble Factor o devuelve token directo
    // ============================================
    @Transactional
    public LoginResponseDto authenticate(String username, String password) {
        Usuario usuario = usuarioRepository.findByUsername(username)
            .or(() -> usuarioRepository.findByEmail(username))
            .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            throw new RuntimeException("Credenciales inválidas");
        }

        if (usuario.getIsBanned()) {
            throw new RuntimeException("Usuario baneado");
        }

        if (Boolean.TRUE.equals(usuario.getTwoFactorEnabled())) {
            // Generar código aleatorio de 6 dígitos
            String code = String.format("%06d", new java.util.Random().nextInt(1000000));
            usuario.setTwoFactorCode(code);
            usuario.setTwoFactorCodeExpiresAt(LocalDateTime.now().plusMinutes(5));
            usuarioRepository.save(usuario);

            // Enviar correo
            mailService.sendTwoFactorCode(usuario.getEmail(), usuario.getUsername(), code);

            return new LoginResponseDto(true, usuario.getUserId(), null);
        }

        String token = jwtService.generateToken(
            usuario.getUserId(),
            usuario.getUsername(),
            usuario.getRole()
        );
        return new LoginResponseDto(false, null, token);
    }

    // ============================================
    // VERIFICAR 2FA: valida código y devuelve JWT
    // ============================================
    @Transactional
    public String verify2Fa(Long userId, String code) {
        Usuario usuario = usuarioRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (usuario.getTwoFactorCode() == null || !usuario.getTwoFactorCode().equals(code)) {
            throw new RuntimeException("Código de verificación incorrecto");
        }

        if (usuario.getTwoFactorCodeExpiresAt() == null || usuario.getTwoFactorCodeExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El código de verificación ha expirado");
        }

        // Limpiar código de verificación usado
        usuario.setTwoFactorCode(null);
        usuario.setTwoFactorCodeExpiresAt(null);
        usuarioRepository.save(usuario);

        return jwtService.generateToken(
            usuario.getUserId(),
            usuario.getUsername(),
            usuario.getRole()
        );
    }

    // ============================================
    // TOGGLE 2FA: activa o desactiva 2FA
    // ============================================
    @Transactional
    public boolean toggle2Fa(Long userId, boolean enabled) {
        Usuario usuario = usuarioRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setTwoFactorEnabled(enabled);
        if (!enabled) {
            usuario.setTwoFactorCode(null);
            usuario.setTwoFactorCodeExpiresAt(null);
        }
        usuarioRepository.save(usuario);
        return enabled;
    }

    // ============================================
    // RECUPERAR CONTRASEÑA: genera token y envía mail
    // ============================================
    @Transactional
    public void requestPasswordReset(String email, String frontendUrl) {
        Usuario usuario = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("No se encontró ningún usuario con ese correo electrónico / Ez da posta hori duen erabiltzailerik aurkitu"));

        String token = java.util.UUID.randomUUID().toString();
        usuario.setResetPasswordToken(token);
        usuario.setResetPasswordTokenExpiresAt(LocalDateTime.now().plusMinutes(15));
        usuarioRepository.save(usuario);

        String resetLink = frontendUrl + "?token=" + token;
        mailService.sendResetPasswordEmail(usuario.getEmail(), usuario.getUsername(), resetLink);
    }

    // ============================================
    // RESTABLECER CONTRASEÑA: valida token y cambia pass
    // ============================================
    @Transactional
    public void resetPassword(String token, String newPassword) {
        Usuario usuario = usuarioRepository.findByResetPasswordToken(token)
            .orElseThrow(() -> new RuntimeException("El enlace de recuperación no es válido / Berreskuratze esteka ez da baliozkoa"));

        if (usuario.getResetPasswordTokenExpiresAt() == null || usuario.getResetPasswordTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El enlace de recuperación ha expirado / Berreskuratze esteka iraungi egin da");
        }

        usuario.setPassword(passwordEncoder.encode(newPassword));
        usuario.setResetPasswordToken(null);
        usuario.setResetPasswordTokenExpiresAt(null);
        usuarioRepository.save(usuario);
    }
}