package com.smartcampus.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LecturerOtpRequestDTO {

    @NotBlank
    @Email
    private String email;
}
