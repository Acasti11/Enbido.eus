package com.mus.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
public class GoogleAuthService {

    @Value("${GOOGLE_CLIENT_ID:}")
    private String googleClientId;

    private GoogleIdTokenVerifier verifier;

    private GoogleIdTokenVerifier getVerifier() {
        if (verifier == null) {
            if (googleClientId == null || googleClientId.isBlank()) {
                throw new IllegalStateException("GOOGLE_CLIENT_ID is not configured");
            }
            verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    new GsonFactory()
            )
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
        }
        return verifier;
    }

    /**
     * Verifies a Google ID token and returns its payload.
     *
     * @param idToken the ID token string from Google Sign-In
     * @return the verified token payload containing user info
     * @throws RuntimeException if the token is invalid, expired, or audience mismatch
     */
    public GoogleIdToken.Payload verifyGoogleToken(String idToken) {
        try {
            GoogleIdToken token = getVerifier().verify(idToken);
            if (token == null) {
                throw new RuntimeException("Invalid Google ID token: verification failed");
            }
            return token.getPayload();
        } catch (GeneralSecurityException | IOException e) {
            throw new RuntimeException("Google token verification error: " + e.getMessage(), e);
        }
    }
}
