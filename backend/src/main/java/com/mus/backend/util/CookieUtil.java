package com.mus.backend.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;

import java.time.Duration;

public final class CookieUtil {

    private CookieUtil() {
        // Utility class
    }

    private static final boolean SECURE = true;
    private static final String SAME_SITE = "Strict";

    public static void addAccessTokenCookie(HttpServletResponse response, String token, long maxAgeMillis) {
        ResponseCookie cookie = ResponseCookie.from("access_token", token)
                .httpOnly(true)
                .secure(SECURE)
                .sameSite(SAME_SITE)
                .maxAge(Duration.ofMillis(maxAgeMillis))
                .path("/")
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public static void addRefreshTokenCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", token)
                .httpOnly(true)
                .secure(SECURE)
                .sameSite(SAME_SITE)
                .maxAge(Duration.ofDays(7))
                .path("/api/auth")
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public static void clearAccessTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(SECURE)
                .sameSite(SAME_SITE)
                .maxAge(Duration.ZERO)
                .path("/")
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public static void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(SECURE)
                .sameSite(SAME_SITE)
                .maxAge(Duration.ZERO)
                .path("/api/auth")
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public static String extractCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (name.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
