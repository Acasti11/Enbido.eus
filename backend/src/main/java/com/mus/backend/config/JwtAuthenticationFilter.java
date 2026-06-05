package com.mus.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import com.mus.backend.service.JwtService;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtService jwtService;
    
    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        if (isPublicPath(path, method)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        String token = getTokenFromRequest(request);
        
        if (StringUtils.hasText(token)) {
            try {
                if (jwtService.isTokenValid(token)) {
                    Long userId = jwtService.extractUserId(token);
                    String username = jwtService.extractUsername(token);
                    
                    // Guardar userId como atributo del request para que los controllers lo lean
                    request.setAttribute("userId", userId);
                    com.mus.backend.service.FriendshipService.updateSessionActivity(userId);
                    // ==================================
                    
                    UsernamePasswordAuthenticationToken auth = 
                        new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            Collections.emptyList()
                        );
                    
                    auth.setDetails(username);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                // Token inválido
            }
        }
        
        filterChain.doFilter(request, response);
    }
    
    private boolean isPublicPath(String path, String method) {
        if ("GET".equalsIgnoreCase(method)) {
            if (path.startsWith("/api/meetups") || 
                path.startsWith("/api/tournaments") || 
                path.startsWith("/api/shop/items") ||
                path.equals("/api/usuarios/leaderboard")) {
                return true;
            }
        }
        if ("POST".equalsIgnoreCase(method)) {
            if (path.equals("/api/usuarios") || 
                path.startsWith("/api/usuarios/login")) {
                return true;
            }
        }
        return false;
    }
    
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}