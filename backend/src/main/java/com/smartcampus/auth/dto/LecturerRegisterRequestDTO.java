package com.smartcampus.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LecturerRegisterRequestDTO {

    @NotBlank
    @Size(min = 2, max = 120)
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8, max = 128)
    private String password;

    @NotBlank
    @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits")
    private String otp;
}
