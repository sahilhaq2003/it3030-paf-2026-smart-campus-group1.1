package com.smartcampus.maintenance.dto;

import com.smartcampus.maintenance.model.enums.TicketCategory;
import com.smartcampus.maintenance.model.enums.Priority;
import com.smartcampus.maintenance.validator.ValidPhoneNumber;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketRequestDTO {

    @NotBlank(message = "Ticket title cannot be empty")
    private String title;

    @NotBlank(message = "Ticket description cannot be empty")
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