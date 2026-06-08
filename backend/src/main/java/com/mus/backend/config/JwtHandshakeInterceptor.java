package com.mus.backend.config;

import com.mus.backend.service.JwtService;
import com.mus.backend.service.TokenBlacklistService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    public JwtHandshakeInterceptor(JwtService jwtService,
                                   TokenBlacklistService tokenBlacklistService) {
        this.jwtService = jwtService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {

        if (request instanceof ServletServerHttpRequest servletRequest) {
            HttpServletRequest httpRequest = servletRequest.getServletRequest();

            String token = extractAccessTokenFromCookie(httpRequest);

            if (token != null && jwtService.isTokenValid(token) && !tokenBlacklistService.isBlacklisted(token)) {
                try {
                    Long userId = jwtService.extractUserId(token);
                    String username = jwtService.extractUsername(token);
                    String role = jwtService.extractRole(token);

                    attributes.put("userId", userId);
                    attributes.put("username", username);
                    attributes.put("role", role);
                    attributes.put("authenticated", true);
                    return true;
                } catch (Exception e) {
                    // Token parsing failed
                }
            }
        }

        // Allow connection but mark as unauthenticated
        // The handlers can decide whether to close or allow anonymous connections
        attributes.put("authenticated", false);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // No-op
    }

    private String extractAccessTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("access_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
