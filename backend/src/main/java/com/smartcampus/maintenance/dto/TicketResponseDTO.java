package com.smartcampus.maintenance.dto;

import com.smartcampus.maintenance.model.enums.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class TicketResponseDTO {
    private Long id;
    private String title;
    private String description;
    private TicketCategory category;
    private Priority priority;
    private String location;
    private Long facilityId;
    private String facilityName;
    private TicketStatus status;
    private String reportedByName;
    private Long reportedById;
    private String assignedToName;
    private Long assignedToId;
    private String resolutionNotes;
    private String rejectionReason;
    private String preferredContact;
    private List<AttachmentDTO> attachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
}