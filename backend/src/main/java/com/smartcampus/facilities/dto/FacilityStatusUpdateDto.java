package com.smartcampus.facilities.dto;

import com.smartcampus.facilities.model.Status;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FacilityStatusUpdateDto {
    @NotNull(message = "Status is required")
    private Status status;
}
