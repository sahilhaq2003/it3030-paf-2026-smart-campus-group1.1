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

    /**
     * Default {@link OncePerRequestFilter} skips async and error dispatches; JWT would not be
     * reapplied and {@code SecurityContext} could be empty → 403 on some POST/multipart paths.
     */
    @Override
    protected boolean shouldNotFilterAsyncDispatch() {
        return false;
    }

    @Override
    protected boolean shouldNotFilterErrorDispatch() {
        return false;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        /*
         * Always honor Authorization: Bearer when present. Do not skip parsing just because
         * SecurityContext already holds another Authentication — some filter orders / dev setups
         * can leave a non-null context before this runs, which previously caused valid JWTs on
         * API calls (e.g. multipart POST /api/tickets) to be ignored → 403.
         */
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length()).trim();
            if (!token.isEmpty()) {
                try {
                    Claims claims = jwtService.parseToken(token);
                    Long userId = toLong(claims.get(JwtService.CLAIM_USER_ID));
                    if (userId == null) {
                        userId = toLong(claims.getSubject());
                    }
                    String email = claims.get(JwtService.CLAIM_EMAIL, String.class);
                    if (userId != null && email != null && !email.isBlank()) {
                        Collection<? extends GrantedAuthority> authorities =
                                authoritiesFromRolesClaim(claims.get(JwtService.CLAIM_ROLES));
                        UserPrincipal principal = new UserPrincipal(userId, email, "", authorities);
                        var auth =
                                new UsernamePasswordAuthenticationToken(
                                        principal, null, principal.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                } catch (JwtException | IllegalArgumentException ignored) {
                    // Invalid token: leave context unchanged; secured endpoints will reject.
                }
            }
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
