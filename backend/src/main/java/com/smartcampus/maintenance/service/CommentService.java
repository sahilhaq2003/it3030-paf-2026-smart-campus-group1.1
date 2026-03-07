package com.smartcampus.maintenance.service;

import com.smartcampus.maintenance.dto.CommentDTO;

import java.util.List;

public interface CommentService {

    List<CommentDTO> getComments(Long ticketId);

    CommentDTO addComment(Long ticketId, String content, Long userId);

    CommentDTO editComment(Long ticketId, Long commentId, String content, Long userId);

    void deleteComment(Long ticketId, Long commentId, Long userId, String userRole);
}
