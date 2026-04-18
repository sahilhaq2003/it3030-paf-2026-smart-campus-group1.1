package com.smartcampus.facilities.dto;

import com.smartcampus.facilities.model.ResourceType;
import com.smartcampus.facilities.model.Status;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.time.LocalTime;
import java.time.LocalDateTime;

/**
 * Data Transfer Object (DTO) for Facility.
 * Used to transfer facility data between the client and the server,
 * and includes validation constraints for the data fields.
 */
@Data
public class FacilityDto {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Resource type is required")
    private ResourceType resourceType;

    @NotNull(message = "Capacity is required")
    @Positive(message = "Capacity must be positive")
    private Integer capacity;

    @NotBlank(message = "Location cannot be empty")
    private String location;

    private String description;

    private LocalTime availabilityStart;

    private LocalTime availabilityEnd;

    @NotNull(message = "Status is required")
    private Status status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Custom validation logic to ensure that the availability start time
     * is before the availability end time.
     * 
     * @return true if the availability time range is valid, false otherwise.
     */
    @AssertTrue(message = "Availability start time must be before end time")
    @JsonIgnore
    public boolean isValidAvailability() {
        if (availabilityStart != null && availabilityEnd != null) {
            return availabilityStart.isBefore(availabilityEnd);
        }
        return true;
    }
}
