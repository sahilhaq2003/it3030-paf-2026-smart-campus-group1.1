package com.smartcampus.auth.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

/** Small helpers so we never rely on {@link Authentication#getAuthorities()} iteration order. */
public final class Authz {

    private Authz() {}

    public static boolean hasAuthority(Authentication auth, String authority) {
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority::equals);
    }

    public static boolean isAdmin(Authentication auth) {
        return hasAuthority(auth, "ROLE_ADMIN");
    }

    public static boolean isTechnician(Authentication auth) {
        return hasAuthority(auth, "ROLE_TECHNICIAN");
    }

    public static boolean isManager(Authentication auth) {
        return hasAuthority(auth, "ROLE_MANAGER");
    }

    /** Admin or campus manager (operations hub). */
    public static boolean isTicketAdmin(Authentication auth) {
        return isAdmin(auth) || isManager(auth);
    }

    /** Full ticket visibility (same idea as {@code GET /api/tickets} for staff). */
    public static boolean isTicketStaff(Authentication auth) {
        return isAdmin(auth) || isTechnician(auth) || isManager(auth);
    }
}
