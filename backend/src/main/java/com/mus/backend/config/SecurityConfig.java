package com.mus.backend.config;

import com.mus.backend.security.JwtAuthenticationFilter;
import com.mus.backend.security.JwtEntryPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtEntryPoint jwtEntryPoint;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          JwtEntryPoint jwtEntryPoint) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.jwtEntryPoint = jwtEntryPoint;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            
            // Sin sesiones, todo es stateless (JWT)
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Manejar errores 401
            .exceptionHandling(ex -> 
                ex.authenticationEntryPoint(jwtEntryPoint))
            
            // Rutas públicas vs protegidas
            .authorizeHttpRequests(auth -> auth
                // PÚBLICAS: no necesitan token
                .requestMatchers("/api/usuarios/login").permitAll()
                .requestMatchers("/api/usuarios").permitAll()  // registro
                .requestMatchers("/api/shop/items").permitAll()  // tienda pública
                
                // PROTEGIDAS: necesitan token válido
                .requestMatchers("/api/usuarios/me").authenticated()
                .requestMatchers("/api/usuarios/me/**").authenticated()
                .requestMatchers("/api/games/**").authenticated()
                
                // SHOP PROTEGIDAS: inventario, comprar, equipar, desequipar
                .requestMatchers("/api/usuarios/me/inventory").authenticated()
                .requestMatchers("/api/usuarios/me/buy/**").authenticated()
                .requestMatchers("/api/usuarios/me/equip/**").authenticated()
                .requestMatchers("/api/usuarios/me/unequip/**").authenticated()
                
                // ADMIN solo
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                .anyRequest().authenticated()
            )
            
            // Añadir filtro JWT antes del filtro de usuario/contraseña
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}