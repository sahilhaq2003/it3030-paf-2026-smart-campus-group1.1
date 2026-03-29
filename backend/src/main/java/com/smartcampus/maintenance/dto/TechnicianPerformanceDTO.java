package com.smartcampus.maintenance.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TechnicianPerformanceDTO {
    private Long technicianId;
    private String technicianName;
    private long ticketsResolved;
    /** Mean hours from ticket creation to resolution; null if no resolved tickets for that technician. */
    private Double avgResolutionHours;
}
