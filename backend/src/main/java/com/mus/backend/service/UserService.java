package com.mus.backend.service;

import com.mus.backend.model.User;
import com.mus.backend.model.LocalAuth;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.repository.UserRepository;
import com.mus.backend.repository.LocalAuthRepository;
import com.mus.backend.repository.UserGameProfileRepository;
import com.mus.backend.dto.UserRegisterDto;
import com.mus.backend.dto.LoginResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final LocalAuthRepository localAuthRepository;
    private final UserGameProfileRepository userGameProfileRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    public UserService(UserRepository userRepository,
                       LocalAuthRepository localAuthRepository,
                       UserGameProfileRepository userGameProfileRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       MailService mailService) {
        this.userRepository = userRepository;
        this.localAuthRepository = localAuthRepository;
        this.userGameProfileRepository = userGameProfileRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
    }

    // ============================================
    // REGISTRO: crea usuario + local_auth + perfil de juego
    // ============================================
    @Transactional
    public String registrarUsuario(UserRegisterDto dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Username ya existe");
        }
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email ya existe");
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setName(dto.getName());
        user.setSurname(dto.getSurname());
        user.setEmail(dto.getEmail());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setBirthDate(dto.getBirthDate());
        user.setPostalCode(dto.getPostalCode());
        user.setRole(User.Role.user);
        user.setIsBanned(false);
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Crear local_auth con password
        LocalAuth localAuth = new LocalAuth();
        localAuth.setUser(savedUser);
        localAuth.setPassword(passwordEncoder.encode(dto.getPassword()));
        localAuthRepository.save(localAuth);

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
        User user = userRepository.findByUsername(username)
            .or(() -> userRepository.findByEmail(username))
            .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        LocalAuth localAuth = localAuthRepository.findByUser_UserId(user.getUserId())
            .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        if (!passwordEncoder.matches(password, localAuth.getPassword())) {
            throw new RuntimeException("Credenciales inválidas");
        }

        if (Boolean.TRUE.equals(user.getIsBanned())) {
            throw new RuntimeException("Usuario baneado");
        }

        if (Boolean.TRUE.equals(localAuth.getTwoFactorEnabled())) {
            // Generar código aleatorio de 6 dígitos
            String code = String.format("%06d", new java.util.Random().nextInt(1000000));
            localAuth.setTwoFactorCode(code);
            localAuth.setTwoFactorCodeExpiresAt(LocalDateTime.now().plusMinutes(5));
            localAuthRepository.save(localAuth);

            // Enviar correo
            mailService.sendTwoFactorCode(user.getEmail(), user.getUsername(), code);

            return new LoginResponseDto(true, user.getUserId(), null);
        }

        String token = jwtService.generateToken(
            user.getUserId(),
            user.getUsername(),
            user.getRole().name()
        );
        return new LoginResponseDto(false, null, token);
    }

    // ============================================
    // VERIFICAR 2FA: valida código y devuelve JWT
    // ============================================
    @Transactional
    public String verify2Fa(Long userId, String code) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        LocalAuth localAuth = localAuthRepository.findByUser_UserId(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (localAuth.getTwoFactorCode() == null || !localAuth.getTwoFactorCode().equals(code)) {
            throw new RuntimeException("Código de verificación incorrecto");
        }

        if (localAuth.getTwoFactorCodeExpiresAt() == null || localAuth.getTwoFactorCodeExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El código de verificación ha expirado");
        }

        // Limpiar código de verificación usado
        localAuth.setTwoFactorCode(null);
        localAuth.setTwoFactorCodeExpiresAt(null);
        localAuthRepository.save(localAuth);

        return jwtService.generateToken(
            user.getUserId(),
            user.getUsername(),
            user.getRole().name()
        );
    }

    // ============================================
    // TOGGLE 2FA: activa o desactiva 2FA
    // ============================================
    @Transactional
    public boolean toggle2Fa(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        LocalAuth localAuth = localAuthRepository.findByUser_UserId(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        localAuth.setTwoFactorEnabled(enabled);
        if (!enabled) {
            localAuth.setTwoFactorCode(null);
            localAuth.setTwoFactorCodeExpiresAt(null);
        }
        localAuthRepository.save(localAuth);
        return enabled;
    }

    // ============================================
    // RECUPERAR CONTRASEÑA: genera token y envía mail
    // ============================================
    @Transactional
    public void requestPasswordReset(String email, String frontendUrl) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("No se encontró ningún usuario con ese correo electrónico / Ez da posta hori duen erabiltzailerik aurkitu"));

        LocalAuth localAuth = localAuthRepository.findByUser_UserId(user.getUserId())
            .orElseThrow(() -> new RuntimeException("No se encontró autenticación local para este usuario"));

        String token = java.util.UUID.randomUUID().toString();
        localAuth.setResetPasswordToken(token);
        localAuth.setResetPasswordTokenExpiresAt(LocalDateTime.now().plusMinutes(15));
        localAuthRepository.save(localAuth);

        String resetLink = frontendUrl + "?token=" + token;
        mailService.sendResetPasswordEmail(user.getEmail(), user.getUsername(), resetLink);
    }

    // ============================================
    // RESTABLECER CONTRASEÑA: valida token y cambia pass
    // ============================================
    @Transactional
    public void resetPassword(String token, String newPassword) {
        LocalAuth localAuth = localAuthRepository.findByResetPasswordToken(token)
            .orElseThrow(() -> new RuntimeException("El enlace de recuperación no es válido / Berreskuratze esteka ez da baliozkoa"));

        if (localAuth.getResetPasswordTokenExpiresAt() == null || localAuth.getResetPasswordTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El enlace de recuperación ha expirado / Berreskuratze esteka iraungi egin da");
        }

        localAuth.setPassword(passwordEncoder.encode(newPassword));
        localAuth.setResetPasswordToken(null);
        localAuth.setResetPasswordTokenExpiresAt(null);
        localAuthRepository.save(localAuth);
    }
}
