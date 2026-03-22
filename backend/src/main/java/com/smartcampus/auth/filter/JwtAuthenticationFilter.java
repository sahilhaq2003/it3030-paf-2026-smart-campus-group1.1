package com.smartcampus.auth.filter;

import com.smartcampus.auth.model.UserPrincipal;
import com.smartcampus.auth.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = jwtService.parseToken(token);
            Long userId = toLong(claims.get(JwtService.CLAIM_USER_ID));
            String email = claims.get(JwtService.CLAIM_EMAIL, String.class);
            if (email == null || email.isBlank()) {
                email = claims.getSubject();
            }
            if (userId == null || email == null || email.isBlank()) {
                filterChain.doFilter(request, response);
                return;
            }
            List<String> roles = toRoleNames(claims.get(JwtService.CLAIM_ROLES));
            UserPrincipal principal = UserPrincipal.of(userId, email, roles);
            var auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (JwtException | IllegalArgumentException ignored) {
            // Invalid token: leave unauthenticated; secured endpoints will reject the request.
        }

        filterChain.doFilter(request, response);
    }

    private static Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static List<String> toRoleNames(Object rolesClaim) {
        if (!(rolesClaim instanceof List<?> raw)) {
            return List.of();
        }
        List<String> out = new ArrayList<>(raw.size());
        for (Object o : raw) {
            if (o != null) {
                out.add(o.toString());
            }
        }
        return out;
    }
}
