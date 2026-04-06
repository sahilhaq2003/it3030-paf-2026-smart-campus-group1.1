package com.smartcampus.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.smartcampus.auth.dto.GoogleUserClaims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Optional;

@Component
public class GoogleOAuthTokenVerifier {

    private final String clientId;
    private volatile GoogleIdTokenVerifier verifier;

    public GoogleOAuthTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    public boolean isEnabled() {
        return !clientId.isEmpty();
    }

    /**
     * Verifies the JWT credential from Google Sign-In and returns claims.
     *
     * @return empty if this component is not configured, or verification fails
     */
    public Optional<GoogleUserClaims> verify(String idToken) {
        if (!isEnabled()) {
            return Optional.empty();
        }
        try {
            GoogleIdTokenVerifier v = getOrCreateVerifier();
            GoogleIdToken token = v.verify(idToken);
            if (token == null) {
                return Optional.empty();
            }
            GoogleIdToken.Payload payload = token.getPayload();
            String email = payload.getEmail();
            if (email == null || email.isBlank()) {
                return Optional.empty();
            }
            Boolean verified = payload.getEmailVerified();
            if (Boolean.FALSE.equals(verified)) {
                return Optional.empty();
            }
            String name = (String) payload.get("name");
            if (name == null || name.isBlank()) {
                name = email;
            }
            String picture = (String) payload.get("picture");
            if (picture != null && picture.isBlank()) {
                picture = null;
            }
            return Optional.of(new GoogleUserClaims(email.trim(), name.trim(), picture));
        } catch (GeneralSecurityException | IOException e) {
            return Optional.empty();
        }
    }

    private GoogleIdTokenVerifier getOrCreateVerifier()
            throws GeneralSecurityException, IOException {
        if (verifier == null) {
            synchronized (this) {
                if (verifier == null) {
                    verifier =
                            new GoogleIdTokenVerifier.Builder(
                                            GoogleNetHttpTransport.newTrustedTransport(),
                                            GsonFactory.getDefaultInstance())
                                    .setAudience(Collections.singletonList(clientId))
                                    .build();
                }
            }
        }
        return verifier;
    }
}
