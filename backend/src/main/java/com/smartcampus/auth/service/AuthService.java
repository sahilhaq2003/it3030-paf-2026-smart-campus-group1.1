package com.smartcampus.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.auth.dto.AuthResponseDTO;
import com.smartcampus.auth.dto.GoogleUserClaims;
import com.smartcampus.auth.dto.LoginRequestDTO;
import com.smartcampus.auth.dto.UserResponseDTO;
import com.smartcampus.auth.model.UserPrincipal;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;
    private final GoogleOAuthTokenVerifier googleOAuthTokenVerifier;

    /**
     * Google Sign-In: when {@code app.google.client-id} is set, verifies the credential JWT with
     * Google. Otherwise accepts {@code dummy-google-token} or a decoded/simulated payload for local
     * development only.
     */
    @Transactional
    public AuthResponseDTO signInWithGoogle(String idToken) {
        SimulatedGoogleProfile profile = resolveGoogleProfile(idToken);
        User user =
                userRepository
                        .findByEmailWithRoles(profile.email())
                        .map(u -> syncGoogleProfile(u, profile))
                        .orElseGet(() -> createGoogleUser(profile));
        userRepository.flush();
        String token = jwtService.generateToken(user);
        return AuthResponseDTO.builder().token(token).user(toUserResponse(user)).build();
    }

    private SimulatedGoogleProfile resolveGoogleProfile(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "idToken is required");
        }
        String trimmed = idToken.trim();
        if ("dummy-google-token".equals(trimmed)) {
            return new SimulatedGoogleProfile("dev@smartcampus.local", "Dev User", null);
        }
        if (googleOAuthTokenVerifier.isEnabled()) {
            Optional<GoogleUserClaims> verified = googleOAuthTokenVerifier.verify(trimmed);
            if (verified.isPresent()) {
                GoogleUserClaims c = verified.get();
                return new SimulatedGoogleProfile(c.email(), c.name(), c.picture());
            }
            if (looksLikeJwt(trimmed)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google credential");
            }
        }
        return parseSimulatedGoogleIdToken(trimmed);
    }

    private static boolean looksLikeJwt(String value) {
        String[] parts = value.split("\\.");
        return parts.length == 3;
    }

    @Transactional(readOnly = true)
    public AuthResponseDTO signInWithPassword(LoginRequestDTO body) {
        String email = body.getEmail() != null ? body.getEmail().trim() : "";
        String rawPassword = body.getPassword();
        if (email.isEmpty() || rawPassword == null || rawPassword.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password required");
        }
        User user =
                userRepository
                        .findByEmailWithRoles(email)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        String token = jwtService.generateToken(user);
        return AuthResponseDTO.builder().token(token).user(toUserResponse(user)).build();
    }

    /** Resolves the current user from the security context (JWT) and returns the persisted profile. */
    @Transactional(readOnly = true)
    public UserResponseDTO getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        User user =
                userRepository
                        .findById(principal.getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toUserResponse(user);
    }

    private User syncGoogleProfile(User user, SimulatedGoogleProfile profile) {
        user.setName(profile.name());
        if (profile.picture() != null && !profile.picture().isBlank()) {
            user.setAvatarUrl(profile.picture());
        }
        user.setProvider(User.AuthProvider.GOOGLE);
        return userRepository.save(user);
    }

    private User createGoogleUser(SimulatedGoogleProfile profile) {
        Set<Role> roles = new HashSet<>();
        roles.add(Role.USER);
        User user =
                User.builder()
                        .email(profile.email())
                        .name(profile.name())
                        .avatarUrl(profile.picture())
                        .provider(User.AuthProvider.GOOGLE)
                        .roles(roles)
                        .enabled(true)
                        .build();
        return userRepository.save(user);
    }

    private UserResponseDTO toUserResponse(User u) {
        Set<String> roleNames =
                u.getRoles().stream().map(Role::name).collect(Collectors.toCollection(TreeSet::new));
        return UserResponseDTO.builder()
                .id(u.getId())
                .email(u.getEmail())
                .name(u.getName())
                .avatarUrl(u.getAvatarUrl())
                .roles(roleNames)
                .provider(u.getProvider().name())
                .enabled(u.isEnabled())
                .build();
    }

    private SimulatedGoogleProfile parseSimulatedGoogleIdToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "idToken is required");
        }
        String trimmed = idToken.trim();
        if ("dummy-google-token".equals(trimmed)) {
            return new SimulatedGoogleProfile("dev@smartcampus.local", "Dev User", null);
        }
        String jsonPayload = null;
        if (trimmed.startsWith("{")) {
            jsonPayload = trimmed;
        } else {
            jsonPayload = decodeJwtPayloadJson(trimmed);
        }
        if (jsonPayload == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid simulated Google id token format");
        }
        try {
            JsonNode root = objectMapper.readTree(jsonPayload);
            String email = text(root, "email");
            String name = text(root, "name");
            if (email == null || email.isBlank() || name == null || name.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Simulated token must include email and name");
            }
            String picture = text(root, "picture");
            return new SimulatedGoogleProfile(
                    email.trim(),
                    name.trim(),
                    picture != null && !picture.isBlank() ? picture.trim() : null);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Could not parse simulated Google id token");
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v != null && !v.isNull() ? v.asText() : null;
    }

    /** JWT payload segment decoded as UTF-8 JSON (no signature verification — simulation only). */
    private static String decodeJwtPayloadJson(String idToken) {
        String[] parts = idToken.split("\\.");
        if (parts.length != 3) {
            return null;
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(padBase64Url(parts[1]));
            return new String(decoded, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String padBase64Url(String segment) {
        StringBuilder sb = new StringBuilder(segment);
        while (sb.length() % 4 != 0) {
            sb.append('=');
        }
        return sb.toString();
    }

    private record SimulatedGoogleProfile(String email, String name, String picture) {}
}
