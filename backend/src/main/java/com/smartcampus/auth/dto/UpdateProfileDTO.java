package com.smartcampus.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileDTO {

    @NotBlank
    @Size(max = 200)
    private String name;

    /** Optional display image URL (e.g. Gravatar or uploaded URL). */
    @Size(max = 2000)
    private String avatarUrl;
}
