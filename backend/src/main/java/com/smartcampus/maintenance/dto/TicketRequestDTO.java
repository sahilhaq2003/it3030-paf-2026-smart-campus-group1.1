package com.smartcampus.maintenance.dto;

import com.smartcampus.maintenance.model.enums.TicketCategory;
import com.smartcampus.maintenance.model.enums.Priority;
import com.smartcampus.maintenance.validator.ValidPhoneNumber;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketRequestDTO {

    @NotBlank(message = "Title is required and cannot be empty")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    @NotBlank(message = "Description is required and cannot be empty")
    @Size(min = 10, max = 5000, message = "Description must be between 10 and 5000 characters")
    private String description;

    @NotNull(message = "Category is required")
    private TicketCategory category;

    @NotNull(message = "Priority is required")
    private Priority priority;

    private String location;

    private Long facilityId;  // optional

    @NotBlank(message = "Phone number is required")
    @ValidPhoneNumber(message = "Invalid phone number. Use format: +94771234567, 0771234567, or 771234567")
    private String preferredContact;
}