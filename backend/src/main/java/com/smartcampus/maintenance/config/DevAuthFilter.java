package com.smartcampus.maintenance.config;

import com.smartcampus.auth.model.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Development filter: sets mock auth from X-User-Id header when no SecurityContext.
 * Runs after {@link com.smartcampus.auth.filter.JwtAuthenticationFilter}; remove for production-only JWT.
 */
@Component
public class DevAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String userId = request.getHeader("X-User-Id");
            if (userId != null && !userId.isBlank()) {
                long id = Long.parseLong(userId.trim());
                var principal = UserPrincipal.of(id, "dev-user-" + id, List.of("ROLE_USER"));
                var auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        filterChain.doFilter(request, response);
    }
}
