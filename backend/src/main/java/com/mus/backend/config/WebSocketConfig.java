package com.mus.backend.config;

import com.mus.backend.controller.ChatWebSocketHandler;
import com.mus.backend.controller.MusGameWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private MusGameWebSocketHandler musGameWebSocketHandler;

    @Autowired
    private ChatWebSocketHandler chatWebSocketHandler;

    @Autowired
    private JwtHandshakeInterceptor jwtHandshakeInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(musGameWebSocketHandler, "/ws-mus")
                .setAllowedOrigins("https://enbido.eus", "https://www.enbido.eus", "http://localhost:5173")
                .addInterceptors(jwtHandshakeInterceptor);

        registry.addHandler(chatWebSocketHandler, "/ws-chat")
                .setAllowedOrigins("https://enbido.eus", "https://www.enbido.eus", "http://localhost:5173")
                .addInterceptors(jwtHandshakeInterceptor);
    }
}
