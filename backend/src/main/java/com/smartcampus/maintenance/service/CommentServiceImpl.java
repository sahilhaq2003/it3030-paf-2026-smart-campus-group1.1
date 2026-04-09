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
        // Verify ticket exists
        var ticket = ticketRepo.findById(ticketId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "Ticket not found. Cannot retrieve comments for non-existent ticket."));
        
        // Verify user has permission to view this ticket's conversation
        assertCanAccessTicketThread(ticket, userId, ticketStaff);
        
        // Retrieve all comments for this ticket in chronological order
        return commentRepo.findByTicket_IdOrderByCreatedAtAsc(ticketId)
            .stream().map(this::mapToDTO).toList();
    }

    @Override
    public CommentDTO addComment(
            Long ticketId, String content, Long userId, boolean isAdmin, boolean isTechnician) {
        // Verify ticket exists
        var ticket = ticketRepo.findById(ticketId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "Ticket not found. Cannot add comments to non-existent ticket."));
        
        // Verify user has permission to post on this ticket
        assertCanPostOnTicket(ticket, userId, isAdmin, isTechnician);

        // Fetch the user object for the comment author
        var user = userRepo.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "User account not found. Cannot attribute comment to user."));

        // Build and save the new comment
        var comment = Comment.builder()
            .ticket(ticket)
            .author(user)
            .content(content)
            .build();

        var saved = commentRepo.save(comment);

        // Notify the ticket reporter if a technician or admin added a comment
        Long reporterId = ticket.getReportedBy().getId();
        if (!reporterId.equals(userId)) {
            eventPublisher.publishEvent(
                    new NewCommentEvent(this, ticketId, reporterId, user.getName()));
        }
        
        // Notify the assigned technician if the reporter adds a comment
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
        // Retrieve the comment
        var comment = commentRepo.findById(commentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "Comment not found. It may have been deleted."));
        
        // Verify the comment belongs to the ticket
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "Comment not found on this ticket.");
        }
        
        // Verify the user is the comment author
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                "You can only edit your own comments.");
        }
        
        // Update comment content and mark as edited
        comment.setContent(content);
        comment.setEdited(true);
        return mapToDTO(commentRepo.save(comment));
    }

    @Override
    public void deleteComment(Long ticketId, Long commentId, Long userId, boolean isAdmin) {
        // Retrieve the comment
        var comment = commentRepo.findById(commentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "Comment not found. It may have already been deleted."));
        
        // Verify the comment belongs to the ticket
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "Comment not found on this ticket.");
        }

        // Only comment author or admin can delete
        boolean isOwner = comment.getAuthor().getId().equals(userId);

        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "You can only delete your own comments. Admins can delete any comment.");
        }

        commentRepo.delete(comment);
    }

    /** 
     * Validates that a user has permission to access/view comments on a ticket.
     * Staff (technicians, admins) can always access. Others can only access if they're the reporter or assigned technician.
     */
    private void assertCanAccessTicketThread(Ticket ticket, Long userId, boolean ticketStaff) {
        if (ticketStaff) {
            return;  // Staff always have access
        }
        if (ticket.getReportedBy().getId().equals(userId)) {
            return;  // Reporter can access their own ticket comments
        }
        if (ticket.getAssignedTo() != null && ticket.getAssignedTo().getId().equals(userId)) {
            return;  // Assigned technician can access ticket comments
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
            "You do not have permission to view comments on this ticket.");
    }

    /** 
     * Validates that a user has permission to post a comment on a ticket.
     * Only the reporter, assigned technician, and admins can post comments.
     */
    private void assertCanPostOnTicket(
            Ticket ticket, Long userId, boolean isAdmin, boolean isTechnician) {
        if (isAdmin) {
            return;  // Admins can always post
        }
        if (ticket.getReportedBy().getId().equals(userId)) {
            return;  // Reporter can post on their own ticket
        }
        if (isTechnician
                && ticket.getAssignedTo() != null
                && ticket.getAssignedTo().getId().equals(userId)) {
            return;  // Assigned technician can post
        }
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, 
                "You cannot add comments on this ticket. Only the reporter, assigned technician, and administrators may comment.");
    }

    private CommentDTO mapToDTO(Comment c) {
        return CommentDTO.builder()
            .id(c.getId())
            .ticketId(c.getTicket().getId())
            .authorId(c.getAuthor().getId())
            .authorName(c.getAuthor().getName())
            .authorAvatarUrl(c.getAuthor().getAvatarUrl())
            .content(c.getContent())
            .isEdited(c.isEdited())
            .createdAt(c.getCreatedAt())
            .updatedAt(c.getUpdatedAt())
            .build();
    }
}