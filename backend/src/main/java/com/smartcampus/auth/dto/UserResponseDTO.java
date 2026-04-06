package com.smartcampus.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
public class UserResponseDTO {
    private Long id;
    private String email;
    private String name;
    private String avatarUrl;
    private Set<String> roles;
    private String provider;
    private boolean enabled;
    private LocalDateTime createdAt;
}
