package com.mus.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationEntryPoint jwtEntryPoint;

    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:8081,https://enbido.eus,https://www.enbido.eus}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          AuthenticationEntryPoint jwtEntryPoint) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.jwtEntryPoint = jwtEntryPoint;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(jwtEntryPoint)
                .accessDeniedHandler(accessDeniedHandler())
            )
            .authorizeHttpRequests(auth -> auth
                // WebSocket handshake (la autenticación real va por mensaje)
                .requestMatchers("/ws-mus", "/ws-chat").permitAll()

                // Auth público
                .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()

                // Usuarios - registro y login públicos
                .requestMatchers(HttpMethod.POST, "/api/usuarios").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/usuarios/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/usuarios/login/verify-2fa").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/usuarios/login/recover-password").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/usuarios/login/reset-password").permitAll()

                // Quedadas - lectura pública
                .requestMatchers(HttpMethod.GET, "/api/meetups").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/meetups/*/participants").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/meetups/*/messages").permitAll()

                // Torneos - lectura pública
                .requestMatchers(HttpMethod.GET, "/api/tournaments").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tournaments/*/details").permitAll()

                // Tienda - lectura pública
                .requestMatchers(HttpMethod.GET, "/api/shop/items").permitAll()

                // Leaderboard público
                .requestMatchers(HttpMethod.GET, "/api/usuarios/leaderboard").permitAll()

                // Admin-only (defensa en profundidad con @PreAuthorize también)
                .requestMatchers(HttpMethod.GET, "/api/usuarios").hasRole("admin")

                // Todo lo demás requiere autenticación
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        config.setAllowedOrigins(origins);

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\":\"Acceso denegado: no tienes permisos para este recurso\"}");
        };
    }
}
