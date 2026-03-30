package com.smartcampus.auth.service;

import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    /** HS256 requires a key at least 256 bits (32 UTF-8 bytes here). */
    private static final String SECRET = "01234567890123456789012345678901";

    private static JwtService service(long expirationMs) {
        return new JwtService(SECRET, expirationMs);
    }

    private static User sampleUser() {
        Set<Role> roles = new HashSet<>(Set.of(Role.USER, Role.ADMIN));
        return User.builder()
                .id(42L)
                .email("jwt-test@smartcampus.local")
                .name("Jwt Tester")
                .roles(roles)
                .build();
    }

    @Test
    void generateToken_includesClaims_andSortedRoles() {
        JwtService jwt = service(3600_000L);
        User user = sampleUser();
        String token = jwt.generateToken(user);

        Claims claims = jwt.parseToken(token);
        assertThat(claims.getSubject()).isEqualTo(user.getEmail());
        assertThat(claims.get(JwtService.CLAIM_USER_ID, Long.class)).isEqualTo(42L);
        assertThat(claims.get(JwtService.CLAIM_EMAIL, String.class)).isEqualTo(user.getEmail());
        @SuppressWarnings("unchecked")
        List<String> roles = claims.get(JwtService.CLAIM_ROLES, List.class);
        assertThat(roles).containsExactly("ADMIN", "USER");
    }

    @Test
    void extractUsername_returnsSubjectEmail() {
        JwtService jwt = service(3600_000L);
        String token = jwt.generateToken(sampleUser());
        assertThat(jwt.extractUsername(token)).isEqualTo("jwt-test@smartcampus.local");
    }

    @Test
    void validateToken_acceptsFreshToken() {
        JwtService jwt = service(3600_000L);
        assertThat(jwt.validateToken(jwt.generateToken(sampleUser()))).isTrue();
    }

    @Test
    void validateToken_rejectsNullAndBlank() {
        JwtService jwt = service(3600_000L);
        assertThat(jwt.validateToken(null)).isFalse();
        assertThat(jwt.validateToken("")).isFalse();
        assertThat(jwt.validateToken("   ")).isFalse();
    }

    @Test
    void validateToken_rejectsTamperedSignature() {
        JwtService jwt = service(3600_000L);
        String token = jwt.generateToken(sampleUser());
        char[] chars = token.toCharArray();
        char flip = chars[chars.length - 5] == 'a' ? 'b' : 'a';
        chars[chars.length - 5] = flip;
        String bad = new String(chars);
        assertThat(jwt.validateToken(bad)).isFalse();
    }

    @Test
    void validateToken_rejectsWrongSigningKey() {
        JwtService jwtA = service(3600_000L);
        JwtService jwtB =
                new JwtService("12345678901234567890123456789012", 3600_000L);
        String token = jwtA.generateToken(sampleUser());
        assertThat(jwtB.validateToken(token)).isFalse();
    }

    @Test
    void validateToken_rejectsExpiredToken() throws Exception {
        JwtService jwt = service(1L);
        String token = jwt.generateToken(sampleUser());
        Thread.sleep(25L);
        assertThat(jwt.validateToken(token)).isFalse();
    }

    @Test
    void parseToken_throwsOnMalformed() {
        JwtService jwt = service(3600_000L);
        assertThatThrownBy(() -> jwt.parseToken("not-a-jwt"))
                .isInstanceOf(Exception.class);
    }

    @Test
    void validateToken_rejectsExplicitlyExpiredJwt() {
        JwtService jwt = service(3600_000L);
        var key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        Instant now = Instant.now();
        String expired =
                Jwts.builder()
                        .subject("x@y.z")
                        .issuedAt(Date.from(now.minusSeconds(120)))
                        .expiration(Date.from(now.minusSeconds(60)))
                        .signWith(key, Jwts.SIG.HS256)
                        .compact();
        assertThat(jwt.validateToken(expired)).isFalse();
    }
}
