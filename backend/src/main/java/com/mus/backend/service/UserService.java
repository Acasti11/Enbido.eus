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
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        try {
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

            LocalAuth localAuth = new LocalAuth();
            localAuth.setUser(savedUser);
            localAuth.setPassword(passwordEncoder.encode(dto.getPassword()));
            localAuthRepository.save(localAuth);

            UserGameProfile profile = new UserGameProfile(savedUser.getUserId());
            if (savedUser.getBirthDate() != null) {
                int age = java.time.LocalDate.now().getYear() - savedUser.getBirthDate().getYear();
                int elo = (int) Math.round(1000.5769 + 30.0668 * age - 0.26948 * age * age);
                elo = Math.max(500, Math.min(2000, elo));
                profile.setElo(elo);
            }
            userGameProfileRepository.save(profile);

            return "Usuario registrado correctamente";
            
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Username or email already exists");
        } catch (Exception e) {
            throw new RuntimeException("Error creating user: " + e.getMessage(), e);
        }
    }

    // ============================================
    // LOGIN: maneja Doble Factor o devuelve login directo
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
            String code = String.format("%06d", new java.util.Random().nextInt(1000000));
            localAuth.setTwoFactorCode(code);
            localAuth.setTwoFactorCodeExpiresAt(LocalDateTime.now().plusMinutes(5));
            localAuthRepository.save(localAuth);

            mailService.sendTwoFactorCode(user.getEmail(), user.getUsername(), code);

            return new LoginResponseDto(true, user.getUserId());
        }

        return new LoginResponseDto(false, null);
    }

    // ============================================
    // VERIFICAR 2FA: valida código
    // ============================================
    @Transactional
    public void verify2Fa(Long userId, String code) {
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

        localAuth.setTwoFactorCode(null);
        localAuth.setTwoFactorCodeExpiresAt(null);
        localAuthRepository.save(localAuth);
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
    // RECUPERAR CONTRASEÑA
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
    // RESTABLECER CONTRASEÑA
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
