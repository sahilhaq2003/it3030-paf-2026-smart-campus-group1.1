package com.smartcampus.facilities.dto;

import com.smartcampus.facilities.model.ResourceType;
import com.smartcampus.facilities.model.Status;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
public class FacilityDto {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Resource type is required")
    private ResourceType resourceType;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private String location;

    private String description;

    private LocalTime availabilityStart;

    private LocalTime availabilityEnd;

    @NotNull(message = "Status is required")
    private Status status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
