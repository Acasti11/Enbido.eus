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

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(musGameWebSocketHandler, "/ws-mus")
                .setAllowedOrigins("*");
        
        registry.addHandler(chatWebSocketHandler, "/ws-chat")
                .setAllowedOrigins("*");
    }
}
