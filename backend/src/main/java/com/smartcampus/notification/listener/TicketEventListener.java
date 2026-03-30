package com.smartcampus.notification.listener;

import com.smartcampus.maintenance.event.NewCommentEvent;
import com.smartcampus.maintenance.event.TicketStatusChangedEvent;
import com.smartcampus.maintenance.repository.TicketRepository;
import com.smartcampus.notification.model.NotificationType;
import com.smartcampus.notification.model.ReferenceType;
import com.smartcampus.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TicketEventListener {

    private final NotificationService notificationService;
    private final TicketRepository ticketRepository;

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

        ticketRepository
                .findById(ticketId)
                .ifPresent(
                        ticket -> {
                            if (ticket.getAssignedTo() != null) {
                                Long assigneeId = ticket.getAssignedTo().getId();
                                if (!assigneeId.equals(reporterId)) {
                                    createTicketNotification(assigneeId, ticketId, title, message);
                                }
                            }
                        });
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
