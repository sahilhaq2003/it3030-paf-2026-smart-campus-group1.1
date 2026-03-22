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
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
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
            Collection<? extends GrantedAuthority> authorities =
                    authoritiesFromRolesClaim(claims.get(JwtService.CLAIM_ROLES));
            UserPrincipal principal = new UserPrincipal(userId, email, "", authorities);
            var auth =
                    new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities());
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

    /**
     * Reads the JWT {@value JwtService#CLAIM_ROLES} claim and returns Spring Security authorities
     * with the {@code ROLE_} prefix (no duplicate prefix if already present).
     */
    private static List<GrantedAuthority> authoritiesFromRolesClaim(Object rolesClaim) {
        List<String> rawNames = new ArrayList<>();
        if (rolesClaim instanceof Collection<?> coll) {
            for (Object o : coll) {
                if (o != null && !o.toString().isBlank()) {
                    rawNames.add(o.toString().trim());
                }
            }
        } else if (rolesClaim instanceof String s && !s.isBlank()) {
            rawNames.add(s.trim());
        }
        List<GrantedAuthority> authorities = new ArrayList<>(rawNames.size());
        for (String name : rawNames) {
            authorities.add(new SimpleGrantedAuthority(withRolePrefix(name)));
        }
        return authorities;
    }

    private static String withRolePrefix(String role) {
        return role.startsWith("ROLE_") ? role : "ROLE_" + role;
    }
}
