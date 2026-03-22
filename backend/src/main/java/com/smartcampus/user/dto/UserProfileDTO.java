package com.smartcampus.user.dto;

import com.smartcampus.user.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {

    private Long id;
    private String email;
    private String name;
    private String avatarUrl;
    private Set<Role> roles;
    private boolean enabled;
}
