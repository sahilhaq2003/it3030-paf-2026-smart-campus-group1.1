package com.smartcampus.maintenance.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class CommentDTO {
    private Long id;
    private Long ticketId;
    private Long authorId;
    private String authorName;
    private String authorAvatarUrl;
    private String content;
    private boolean edited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}