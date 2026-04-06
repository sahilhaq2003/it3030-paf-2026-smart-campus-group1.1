package com.smartcampus.auth.dto;

/** Email / profile extracted from a verified Google ID token. */
public record GoogleUserClaims(String email, String name, String picture) {}
