package com.smartcampus.maintenance.service;

import com.smartcampus.maintenance.dto.CommentDTO;
import com.smartcampus.maintenance.event.NewCommentEvent;
import com.smartcampus.maintenance.model.Comment;
import com.smartcampus.maintenance.model.Ticket;
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
    public List<CommentDTO> getComments(Long ticketId, Long userId, boolean ticketStaff) {
        var ticket = ticketRepo.findById(ticketId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanAccessTicketThread(ticket, userId, ticketStaff);
        return commentRepo.findByTicket_IdOrderByCreatedAtAsc(ticketId)
            .stream().map(this::mapToDTO).toList();
    }

    @Override
    public CommentDTO addComment(
            Long ticketId, String content, Long userId, boolean isAdmin, boolean isTechnician) {
        var ticket = ticketRepo.findById(ticketId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanPostOnTicket(ticket, userId, isAdmin, isTechnician);

        var user = userRepo.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        var comment = Comment.builder()
            .ticket(ticket)
            .author(user)
            .content(content)
            .build();

        var saved = commentRepo.save(comment);

        Long reporterId = ticket.getReportedBy().getId();
        if (!reporterId.equals(userId)) {
            eventPublisher.publishEvent(
                    new NewCommentEvent(this, ticketId, reporterId, user.getName()));
        }
        if (ticket.getAssignedTo() != null
                && reporterId.equals(userId)
                && !ticket.getAssignedTo().getId().equals(userId)) {
            eventPublisher.publishEvent(
                    new NewCommentEvent(
                            this, ticketId, ticket.getAssignedTo().getId(), user.getName()));
        }

        return mapToDTO(saved);
    }

    @Override
    public CommentDTO editComment(Long ticketId, Long commentId, String content, Long userId) {
        var comment = commentRepo.findById(commentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own comments");
        }
        comment.setContent(content);
        comment.setEdited(true);
        return mapToDTO(commentRepo.save(comment));
    }

    @Override
    public void deleteComment(Long ticketId, Long commentId, Long userId, boolean isAdmin) {
        var comment = commentRepo.findById(commentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }

        boolean isOwner = comment.getAuthor().getId().equals(userId);

        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "You can only delete your own comments");
        }

        commentRepo.delete(comment);
    }

    /** Same visibility as ticket detail: staff see all; others only reporter or assignee threads. */
    private void assertCanAccessTicketThread(Ticket ticket, Long userId, boolean ticketStaff) {
        if (ticketStaff) {
            return;
        }
        if (ticket.getReportedBy().getId().equals(userId)) {
            return;
        }
        if (ticket.getAssignedTo() != null && ticket.getAssignedTo().getId().equals(userId)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    /** Reporter, assigned technician, or admin may post (conversation between campus user and handler). */
    private void assertCanPostOnTicket(
            Ticket ticket, Long userId, boolean isAdmin, boolean isTechnician) {
        if (isAdmin) {
            return;
        }
        if (ticket.getReportedBy().getId().equals(userId)) {
            return;
        }
        if (isTechnician
                && ticket.getAssignedTo() != null
                && ticket.getAssignedTo().getId().equals(userId)) {
            return;
        }
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, "You cannot add messages on this ticket");
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