package com.smartcampus.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTechnicianDTO {

    @NotBlank @Email @Size(max = 320)
    private String email;

    @NotBlank @Size(min = 2, max = 120)
    private String name;

    @NotBlank @Size(min = 8, max = 128)
    private String password;
}
