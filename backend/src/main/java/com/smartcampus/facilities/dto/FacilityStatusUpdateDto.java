package com.smartcampus.facilities.dto;

import com.smartcampus.facilities.model.Status;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Data Transfer Object (DTO) for updating the status of a facility.
 * Used for patch requests targeting specific status updates.
 */
@Data
public class FacilityStatusUpdateDto {
    @NotNull(message = "Status is required")
    private Status status;
}
