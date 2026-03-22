package com.smartcampus.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.auth.dto.AuthResponseDTO;
import com.smartcampus.auth.dto.UserResponseDTO;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    /**
     * Simulated Google ID token handling: accepts a JWT-shaped string (payload decoded without
     * signature verification) or a raw JSON object {@code {"email","name"[, "picture"]}}.
     */
    @Transactional
    public AuthResponseDTO signInWithGoogle(String idToken) {
        SimulatedGoogleProfile profile = parseSimulatedGoogleIdToken(idToken);
        User user =
                userRepository
                        .findByEmail(profile.email())
                        .map(u -> syncGoogleProfile(u, profile))
                        .orElseGet(() -> createGoogleUser(profile));
        userRepository.flush();
        String token = jwtService.generateToken(user);
        return AuthResponseDTO.builder().token(token).user(toUserResponse(user)).build();
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
