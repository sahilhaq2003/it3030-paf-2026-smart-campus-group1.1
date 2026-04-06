package com.smartcampus.notification.listener;

import com.smartcampus.maintenance.event.NewCommentEvent;
import com.smartcampus.maintenance.event.TicketStatusChangedEvent;
import com.smartcampus.maintenance.event.TicketSubmittedEvent;
import com.smartcampus.maintenance.event.TicketTechnicianAssignedEvent;
import com.smartcampus.maintenance.model.enums.TicketStatus;
import com.smartcampus.maintenance.repository.TicketRepository;
import com.smartcampus.notification.model.NotificationType;
import com.smartcampus.notification.model.ReferenceType;
import com.smartcampus.notification.service.NotificationService;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class TicketEventListener {

    private final NotificationService notificationService;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    @EventListener
    public void onTicketStatusChanged(TicketStatusChangedEvent event) {
        Long ticketId = event.getTicketId();
        String title = "Ticket status updated";
        String message =
                String.format(
                        "Ticket #%d: %s → %s",
                        ticketId, event.getPreviousStatus(), event.getNewStatus());

        Long reporterId = event.getOwnerId();
        createTicketNotification(reporterId, ticketId, title, message);

        Long assigneeId = null;
        Optional<com.smartcampus.maintenance.model.Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isPresent() && ticketOpt.get().getAssignedTo() != null) {
            assigneeId = ticketOpt.get().getAssignedTo().getId();
            if (assigneeId != null && !assigneeId.equals(reporterId)) {
                createTicketNotification(assigneeId, ticketId, title, message);
            }
        }

        // Requirement: when a technician resolves a ticket, admins should be notified.
        // We treat `RESOLVED` as the "resolved by technician" step and notify all admins.
        if (event.getNewStatus() == TicketStatus.RESOLVED) {
            Set<Long> adminIds = new HashSet<>();
            for (User u : userRepository.findAllWithRoles()) {
                if (u.getRoles() != null && u.getRoles().contains(Role.ADMIN) && u.getId() != null) {
                    adminIds.add(u.getId());
                }
            }

            // Avoid duplicates if the reporter/assignee is also an admin.
            adminIds.remove(reporterId);
            if (assigneeId != null) {
                adminIds.remove(assigneeId);
            }

            for (Long adminId : adminIds) {
                createTicketNotification(adminId, ticketId, title, message);
            }
        }
    }

    /**
     * {@link com.smartcampus.maintenance.service.CommentServiceImpl} already emits one event per
     * recipient (reporter and/or assignee when both should be notified).
     */
    @EventListener
    public void onNewComment(NewCommentEvent event) {
        notificationService.createNotification(
                event.getTicketOwnerId(),
                NotificationType.NEW_COMMENT,
                "New comment on a ticket",
                String.format(
                        "%s commented on ticket #%d", event.getCommenterName(), event.getTicketId()),
                event.getTicketId(),
                ReferenceType.TICKET);
    }

    @EventListener
    public void onTicketSubmitted(TicketSubmittedEvent event) {
        notificationService.createNotification(
                event.getOwnerId(),
                NotificationType.GENERAL,
                "Ticket submitted",
                String.format("Your ticket #%d has been submitted.", event.getTicketId()),
                event.getTicketId(),
                ReferenceType.TICKET);
    }

    @EventListener
    public void onTechnicianAssigned(TicketTechnicianAssignedEvent event) {
        notificationService.createNotification(
                event.getOwnerId(),
                NotificationType.GENERAL,
                "Technician assigned",
                String.format(
                        "A technician (%s) has been assigned to your ticket #%d.",
                        event.getTechnicianName() != null ? event.getTechnicianName() : "N/A",
                        event.getTicketId()),
                event.getTicketId(),
                ReferenceType.TICKET);
    }

    private void createTicketNotification(
            Long recipientUserId, Long ticketId, String title, String message) {
        notificationService.createNotification(
                recipientUserId,
                NotificationType.TICKET_STATUS_CHANGED,
                title,
                message,
                ticketId,
                ReferenceType.TICKET);
    }
}
