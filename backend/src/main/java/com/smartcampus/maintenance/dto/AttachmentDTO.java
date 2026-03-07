package com.smartcampus.maintenance.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class AttachmentDTO {
    private Long id;
    private String originalName;
    private String url;  // e.g. /api/tickets/{ticketId}/attachments/{filename}
    private String mimeType;
    private Long size;
}