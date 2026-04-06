package com.smartcampus.maintenance.controller;

import com.smartcampus.auth.util.Authz;
import com.smartcampus.maintenance.dto.CommentDTO;
import com.smartcampus.maintenance.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CommentDTO>> getComments(
            @PathVariable Long ticketId, Authentication auth) {
        return ResponseEntity.ok(
                commentService.getComments(
                        ticketId, getUserId(auth), Authz.isTicketStaff(auth)));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentDTO> addComment(
        @PathVariable Long ticketId,
        @Valid @RequestBody CommentDTO commentDTO,
        Authentication auth
    ) {
        Long userId = getUserId(auth);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(
                    commentService.addComment(
                            ticketId,
                            commentDTO.getContent(),
                            userId,
                            Authz.isTicketAdmin(auth),
                            Authz.isTechnician(auth)));
    }

    @PutMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentDTO> editComment(
        @PathVariable Long ticketId,
        @PathVariable Long commentId,
        @Valid @RequestBody CommentDTO commentDTO,
        Authentication auth
    ) {
        return ResponseEntity.ok(
            commentService.editComment(ticketId, commentId, commentDTO.getContent(), getUserId(auth)));
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteComment(
        @PathVariable Long ticketId,
        @PathVariable Long commentId,
        Authentication auth
    ) {
        commentService.deleteComment(
                ticketId, commentId, getUserId(auth), Authz.isTicketAdmin(auth));
        return ResponseEntity.noContent().build();
    }

    private Long getUserId(Authentication auth) {
        return ((com.smartcampus.auth.model.UserPrincipal) auth.getPrincipal()).getId();
    }
}