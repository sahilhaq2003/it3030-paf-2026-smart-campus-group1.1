package com.smartcampus.maintenance.dto;

import com.smartcampus.maintenance.model.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketStatusUpdateDTO {
    @NotNull
    private TicketStatus status;

    private String resolutionNotes;   // required when RESOLVED
    private String rejectionReason;   // required when REJECTED
}