package com.mus.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.mus.backend.dto.UserDTO;
import com.mus.backend.model.LocalAuth;
import com.mus.backend.model.OAuthAuth;
import com.mus.backend.model.User;
import com.mus.backend.repository.LocalAuthRepository;
import com.mus.backend.repository.OAuthAuthRepository;
import com.mus.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final LocalAuthRepository localAuthRepository;
    private final OAuthAuthRepository oauthAuthRepository;
    private final GoogleAuthService googleAuthService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                       LocalAuthRepository localAuthRepository,
                       OAuthAuthRepository oauthAuthRepository,
                       GoogleAuthService googleAuthService,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.localAuthRepository = localAuthRepository;
        this.oauthAuthRepository = oauthAuthRepository;
        this.googleAuthService = googleAuthService;
        this.passwordEncoder = passwordEncoder;
    }

    // ============================================================
    // LOGIN TRADICIONAL: email + password
    // Returns UserDTO only (cookies are set by controller)
    // ============================================================
    @Transactional(readOnly = true)
    public UserDTO loginTraditional(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (Boolean.TRUE.equals(user.getIsBanned())) {
            throw new RuntimeException("User is banned");
        }

        LocalAuth localAuth = localAuthRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(password, localAuth.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        return mapToUserDTO(user);
    }

    // ============================================================
    // LOGIN GOOGLE: valida token, encuentra o crea usuario
    // Returns UserDTO only (cookies are set by controller)
    // ============================================================
    @Transactional
    public UserDTO loginGoogle(String idToken) {
        GoogleIdToken.Payload payload = googleAuthService.verifyGoogleToken(idToken);

        String email = payload.getEmail();
        Boolean emailVerified = payload.getEmailVerified();
        if (email == null || !Boolean.TRUE.equals(emailVerified)) {
            throw new RuntimeException("Google email not verified");
        }

        String googleUserId = payload.getSubject();
        String name = (String) payload.get("given_name");
        String surname = (String) payload.get("family_name");
        String picture = (String) payload.get("picture");

        if (name == null || name.isBlank()) {
            name = (String) payload.get("name");
            if (name == null || name.isBlank()) {
                name = email.split("@")[0];
            }
        }

        // 1. Buscar en oauth_auth por (provider='google', provider_user_id)
        User user = oauthAuthRepository.findByProviderAndProviderUserId("google", googleUserId)
                .map(OAuthAuth::getUser)
                .orElse(null);

        if (user != null) {
            if (Boolean.TRUE.equals(user.getIsBanned())) {
                throw new RuntimeException("User is banned");
            }
            return mapToUserDTO(user);
        }

        // 2. No existe en oauth_auth → buscar en users por email
        user = userRepository.findByEmail(email).orElse(null);

        if (user != null) {
            if (Boolean.TRUE.equals(user.getIsBanned())) {
                throw new RuntimeException("User is banned");
            }
            createOAuthAuth(user, "google", googleUserId, email, null, null);
        } else {
            // 3. Usuario completamente nuevo → crear users + oauth_auth
            user = createUserFromGoogle(name, surname, email, picture);
            createOAuthAuth(user, "google", googleUserId, email, null, null);
        }

        return mapToUserDTO(user);
    }

    // ============================================================
    // LINK GOOGLE: vincular cuenta Google a usuario existente
    // ============================================================
    @Transactional
    public void linkGoogleAccount(Long userId, String idToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GoogleIdToken.Payload payload = googleAuthService.verifyGoogleToken(idToken);

        String email = payload.getEmail();
        Boolean emailVerified = payload.getEmailVerified();
        if (email == null || !Boolean.TRUE.equals(emailVerified)) {
            throw new RuntimeException("Google email not verified");
        }

        String googleUserId = payload.getSubject();

        if (oauthAuthRepository.existsByProviderAndProviderUserId("google", googleUserId)) {
            throw new RuntimeException("This Google account is already linked to another user");
        }

        createOAuthAuth(user, "google", googleUserId, email, null, null);
    }

    // ============================================================
    // HELPERS
    // ============================================================
    private User createUserFromGoogle(String name, String surname, String email, String picture) {
        User user = new User();
        user.setName(name);
        user.setSurname(surname);
        user.setEmail(email);
        user.setProfilePicture(picture);
        user.setRole(User.Role.user);
        user.setIsBanned(false);

        String baseUsername = email.split("@")[0];
        String username = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + suffix;
            suffix++;
        }
        user.setUsername(username);

        return userRepository.save(user);
    }

    private OAuthAuth createOAuthAuth(User user, String provider, String providerUserId,
                                      String providerEmail, String accessToken, String refreshToken) {
        OAuthAuth oauthAuth = new OAuthAuth();
        oauthAuth.setUser(user);
        oauthAuth.setProvider(provider);
        oauthAuth.setProviderUserId(providerUserId);
        oauthAuth.setProviderEmail(providerEmail);
        oauthAuth.setAccessToken(accessToken);
        oauthAuth.setRefreshToken(refreshToken);
        return oauthAuthRepository.save(oauthAuth);
    }

    public UserDTO mapToUserDTO(User user) {
        return new UserDTO(
                user.getUserId(),
                user.getEmail(),
                user.getName(),
                user.getSurname(),
                user.getUsername(),
                user.getRole().name(),
                user.getProfilePicture()
        );
    }
}
