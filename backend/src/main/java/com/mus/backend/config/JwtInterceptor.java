package com.mus.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import com.mus.backend.service.JwtService;

@Component
public class JwtInterceptor implements HandlerInterceptor {
    
    private final JwtService jwtService;
    
    public JwtInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        // Rutas públicas que NO requieren token
        if (isPublicPath(path, method)) {
            return true;
        }
        
        // Validar token
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            
            try {
                if (jwtService.isTokenValid(token)) {
                    Long userId = jwtService.extractUserId(token);
                    request.setAttribute("userId", userId);
                    com.mus.backend.service.FriendshipService.updateSessionActivity(userId);
                    return true;
                }
            } catch (Exception e) {
                // Token inválido
            }
        }
        
        // No autorizado
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"No autorizado: token inválido o ausente\"}");
        return false;
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
                path.startsWith("/api/usuarios/login") ||
                path.startsWith("/api/auth")) {
                return true;
            }
        }
        return false;
    }
}