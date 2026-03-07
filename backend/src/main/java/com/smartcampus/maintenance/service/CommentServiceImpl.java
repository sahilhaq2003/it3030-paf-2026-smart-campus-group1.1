package com.smartcampus.maintenance.service;

import com.smartcampus.maintenance.dto.CommentDTO;
import com.smartcampus.maintenance.event.NewCommentEvent;
import com.smartcampus.maintenance.model.Comment;
import com.smartcampus.maintenance.repository.CommentRepository;
import com.smartcampus.maintenance.repository.TicketRepository;
import com.smartcampus.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepo;
    private final TicketRepository ticketRepo;
    private final UserRepository userRepo;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public List<CommentDTO> getComments(Long ticketId) {
        return commentRepo.findByTicket_IdOrderByCreatedAtAsc(ticketId)
            .stream().map(this::mapToDTO).toList();
    }

    @Override
    public CommentDTO addComment(Long ticketId, String content, Long userId) {
        var ticket = ticketRepo.findById(ticketId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        var user = userRepo.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        var comment = Comment.builder()
            .ticket(ticket)
            .author(user)
            .content(content)
            .build();

        var saved = commentRepo.save(comment);

        // Notify ticket owner if someone else commented
        if (!ticket.getReportedBy().getId().equals(userId)) {
            eventPublisher.publishEvent(new NewCommentEvent(
                this, ticketId, ticket.getReportedBy().getId(), user.getName()
            ));
        }

        return mapToDTO(saved);
    }

    @Override
    public CommentDTO editComment(Long ticketId, Long commentId, String content, Long userId) {
        var comment = findAndCheckOwnership(commentId, userId, "edit");
        comment.setContent(content);
        comment.setEdited(true);
        return mapToDTO(commentRepo.save(comment));
    }

    @Override
    public void deleteComment(Long ticketId, Long commentId, Long userId, String userRole) {
        var comment = commentRepo.findById(commentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        boolean isOwner = comment.getAuthor().getId().equals(userId);
        boolean isAdmin = userRole.contains("ADMIN");

        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "You can only delete your own comments");
        }

        commentRepo.delete(comment);
    }

    private Comment findAndCheckOwnership(Long commentId, Long userId, String action) {
        var comment = commentRepo.findById(commentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (!comment.getAuthor().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "You can only " + action + " your own comments");
        }
        return comment;
    }

    private CommentDTO mapToDTO(Comment c) {
        return CommentDTO.builder()
            .id(c.getId())
            .ticketId(c.getTicket().getId())
            .authorId(c.getAuthor().getId())
            .authorName(c.getAuthor().getName())
            .authorAvatarUrl(c.getAuthor().getAvatarUrl())
            .content(c.getContent())
            .edited(c.isEdited())
            .createdAt(c.getCreatedAt())
            .updatedAt(c.getUpdatedAt())
            .build();
    }
}