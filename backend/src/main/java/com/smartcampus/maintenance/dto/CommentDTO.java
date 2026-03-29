package com.smartcampus.maintenance.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}