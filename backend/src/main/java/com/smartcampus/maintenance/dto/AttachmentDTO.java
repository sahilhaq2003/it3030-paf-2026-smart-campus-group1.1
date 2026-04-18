package com.smartcampus.maintenance.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class AttachmentDTO {
    private Long id;
    private String originalName;
    private String url;  // e.g. /api/tickets/{ticketId}/attachments/{filename}
    private String mimeType;
    private Long size;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime uploadDate;  // Timestamp when file was uploaded
}