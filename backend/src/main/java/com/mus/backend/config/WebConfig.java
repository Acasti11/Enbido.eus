package com.mus.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // JwtInterceptor eliminado: la autenticación JWT ahora se maneja
    // exclusivamente mediante JwtAuthenticationFilter en el filtro de Spring Security
}
