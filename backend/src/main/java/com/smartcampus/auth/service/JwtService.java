package com.smartcampus.auth.service;

import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {

    public static final String CLAIM_USER_ID = "userId";
    public static final String CLAIM_EMAIL = "email";
    public static final String CLAIM_ROLES = "roles";

    private static final long TWENTY_FOUR_HOURS_MS = 24L * 60 * 60 * 1000;

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration:86400000}") long expirationMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs > 0 ? expirationMs : TWENTY_FOUR_HOURS_MS;
    }

    /**
     * Issues an HS256 JWT with userId, email, and roles claims.
     * Subject is the user's email (for {@link #extractUsername(String)}).
     */
    public String generateToken(User user) {
        List<String> roleNames =
                user.getRoles() == null || user.getRoles().isEmpty()
                        ? List.of()
                        : user.getRoles().stream().map(Role::name).sorted().toList();
        Instant now = Instant.now();
        Instant exp = now.plusMillis(expirationMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim(CLAIM_USER_ID, user.getId())
                .claim(CLAIM_EMAIL, user.getEmail())
                .claim(CLAIM_ROLES, roleNames)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

    /** Returns the JWT subject (email). */
    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    /** True if the token is well-formed, signed with this secret, and not expired. */
    public boolean validateToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** Verifies signature and expiry and returns claims. */
    public Claims parseToken(String token) {
        return parseClaims(token);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
