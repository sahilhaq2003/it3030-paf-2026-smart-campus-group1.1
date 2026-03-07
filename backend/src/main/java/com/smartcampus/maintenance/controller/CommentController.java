package com.smartcampus.maintenance.controller;

import com.smartcampus.maintenance.dto.CommentDTO;
import com.smartcampus.maintenance.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CommentDTO>> getComments(@PathVariable Long ticketId) {
        return ResponseEntity.ok(commentService.getComments(ticketId));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentDTO> addComment(
        @PathVariable Long ticketId,
        @RequestBody Map<String, String> body,
        Authentication auth
    ) {
        Long userId = getUserId(auth);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(commentService.addComment(ticketId, body.get("content"), userId));
    }

    @PutMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentDTO> editComment(
        @PathVariable Long ticketId,
        @PathVariable Long commentId,
        @RequestBody Map<String, String> body,
        Authentication auth
    ) {
        return ResponseEntity.ok(
            commentService.editComment(ticketId, commentId, body.get("content"), getUserId(auth)));
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteComment(
        @PathVariable Long ticketId,
        @PathVariable Long commentId,
        Authentication auth
    ) {
        String role = auth.getAuthorities().iterator().next().getAuthority();
        commentService.deleteComment(ticketId, commentId, getUserId(auth), role);
        return ResponseEntity.noContent().build();
    }

    private Long getUserId(Authentication auth) {
        return ((com.smartcampus.auth.model.UserPrincipal) auth.getPrincipal()).getId();
    }
}