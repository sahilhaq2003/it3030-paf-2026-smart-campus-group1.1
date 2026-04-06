package com.smartcampus.auth.test;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContext;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

import com.smartcampus.auth.model.UserPrincipal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.util.Arrays;
import java.util.stream.Collectors;

@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockUserPrincipalSecurityContextFactory.class)
public @interface WithMockUserPrincipal {
    long id() default 1L;
    String username() default "test@test.com";
    String[] roles() default {"ROLE_USER"};
}

class WithMockUserPrincipalSecurityContextFactory implements WithSecurityContextFactory<WithMockUserPrincipal> {
    
    @Override
    public SecurityContext createSecurityContext(WithMockUserPrincipal annotation) {
        var authorities = Arrays.stream(annotation.roles())
                .map(r -> new SimpleGrantedAuthority(r.startsWith("ROLE_") ? r : "ROLE_" + r))
                .collect(Collectors.toList());
        
        UserPrincipal principal = new UserPrincipal(
                annotation.id(),
                annotation.username(),
                "",
                authorities
        );
        
        var auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                authorities
        );
        
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        return context;
    }
}
