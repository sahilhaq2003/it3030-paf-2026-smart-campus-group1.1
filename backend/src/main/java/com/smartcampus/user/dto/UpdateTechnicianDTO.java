package com.smartcampus.user.dto;

import com.smartcampus.user.model.TechnicianCategory;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Partial update for technician roster (admin). At least one field should be non-blank. */
@Data
public class UpdateTechnicianDTO {

    @Size(min = 2, max = 120)
    private String name;

    @Email
    @Size(max = 320)
    private String email;

    @Size(min = 8, max = 128)
    private String password;

    private TechnicianCategory technicianCategory;
}
