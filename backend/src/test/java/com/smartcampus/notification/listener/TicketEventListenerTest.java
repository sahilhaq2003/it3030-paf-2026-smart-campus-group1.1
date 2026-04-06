package com.smartcampus.notification.listener;

import com.smartcampus.maintenance.event.NewCommentEvent;
import com.smartcampus.maintenance.event.TicketStatusChangedEvent;
import com.smartcampus.maintenance.event.TicketSubmittedEvent;
import com.smartcampus.maintenance.event.TicketTechnicianAssignedEvent;
import com.smartcampus.maintenance.model.Ticket;
import com.smartcampus.maintenance.model.enums.TicketStatus;
import com.smartcampus.maintenance.repository.TicketRepository;
import com.smartcampus.notification.model.NotificationType;
import com.smartcampus.notification.model.ReferenceType;
import com.smartcampus.notification.service.NotificationService;
import com.smartcampus.user.model.User;
import com.smartcampus.user.model.Role;
import com.smartcampus.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketEventListenerTest {

    @Mock NotificationService notificationService;
    @Mock TicketRepository ticketRepository;
    @Mock UserRepository userRepository;

    @InjectMocks TicketEventListener listener;

    private Object source;

    @BeforeEach
    void setUp() {
        source = this;
    }

    @Test
    void onTicketStatusChanged_notifiesReporter_onlyWhenNoAssigneeLoaded() {
        when(ticketRepository.findById(10L)).thenReturn(Optional.empty());

        listener.onTicketStatusChanged(
                new TicketStatusChangedEvent(
                        source, 10L, 5L, TicketStatus.OPEN, TicketStatus.IN_PROGRESS));

        ArgumentCaptor<Long> uid = ArgumentCaptor.forClass(Long.class);
        verify(notificationService)
                .createNotification(
                        uid.capture(),
                        org.mockito.ArgumentMatchers.eq(NotificationType.TICKET_STATUS_CHANGED),
                        org.mockito.ArgumentMatchers.eq("Ticket status updated"),
                        org.mockito.ArgumentMatchers.eq("Ticket #10: OPEN → IN_PROGRESS"),
                        org.mockito.ArgumentMatchers.eq(10L),
                        org.mockito.ArgumentMatchers.eq(ReferenceType.TICKET));
        assertThat(uid.getValue()).isEqualTo(5L);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void onTicketStatusChanged_notifiesAssigneeWhenDifferentFromReporter() {
        User assignee = User.builder().id(8L).email("a@x.z").name("A").build();
        Ticket ticket = Ticket.builder().id(10L).assignedTo(assignee).build();
        when(ticketRepository.findById(10L)).thenReturn(Optional.of(ticket));

        listener.onTicketStatusChanged(
                new TicketStatusChangedEvent(
                        source, 10L, 5L, TicketStatus.OPEN, TicketStatus.IN_PROGRESS));

        verify(notificationService)
                .createNotification(
                        5L,
                        NotificationType.TICKET_STATUS_CHANGED,
                        "Ticket status updated",
                        "Ticket #10: OPEN → IN_PROGRESS",
                        10L,
                        ReferenceType.TICKET);
        verify(notificationService)
                .createNotification(
                        8L,
                        NotificationType.TICKET_STATUS_CHANGED,
                        "Ticket status updated",
                        "Ticket #10: OPEN → IN_PROGRESS",
                        10L,
                        ReferenceType.TICKET);
    }

    @Test
    void onNewComment_delegatesToNotificationService() {
        listener.onNewComment(new NewCommentEvent(source, 20L, 3L, "Sam"));

        verify(notificationService)
                .createNotification(
                        3L,
                        NotificationType.NEW_COMMENT,
                        "New comment on a ticket",
                        "Sam commented on ticket #20",
                        20L,
                        ReferenceType.TICKET);
    }

    @Test
    void onTicketSubmitted_notifiesTicketOwner() {
        listener.onTicketSubmitted(new TicketSubmittedEvent(source, 10L, 5L, "My Ticket"));

        verify(notificationService)
                .createNotification(
                        5L,
                        NotificationType.GENERAL,
                        "Ticket submitted",
                        "Your ticket #10 has been submitted.",
                        10L,
                        ReferenceType.TICKET);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void onTechnicianAssigned_notifiesTicketOwner() {
        listener.onTechnicianAssigned(
                new TicketTechnicianAssignedEvent(source, 10L, 5L, 8L, "Tech Name"));

        verify(notificationService)
                .createNotification(
                        5L,
                        NotificationType.GENERAL,
                        "Technician assigned",
                        "A technician (Tech Name) has been assigned to your ticket #10.",
                        10L,
                        ReferenceType.TICKET);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void onTicketStatusChanged_whenResolved_notifiesAdmins() {
        when(ticketRepository.findById(10L)).thenReturn(Optional.empty());

        User admin1 =
                User.builder()
                        .id(11L)
                        .email("admin1@test.local")
                        .name("Admin One")
                        .roles(Set.of(Role.ADMIN))
                        .build();
        User admin2 =
                User.builder()
                        .id(12L)
                        .email("admin2@test.local")
                        .name("Admin Two")
                        .roles(Set.of(Role.ADMIN))
                        .build();
        when(userRepository.findAllWithRoles()).thenReturn(List.of(admin1, admin2));

        listener.onTicketStatusChanged(
                new TicketStatusChangedEvent(
                        source, 10L, 5L, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED));

        verify(notificationService)
                .createNotification(
                        5L,
                        NotificationType.TICKET_STATUS_CHANGED,
                        "Ticket status updated",
                        "Ticket #10: IN_PROGRESS → RESOLVED",
                        10L,
                        ReferenceType.TICKET);
        verify(notificationService)
                .createNotification(
                        11L,
                        NotificationType.TICKET_STATUS_CHANGED,
                        "Ticket status updated",
                        "Ticket #10: IN_PROGRESS → RESOLVED",
                        10L,
                        ReferenceType.TICKET);
        verify(notificationService)
                .createNotification(
                        12L,
                        NotificationType.TICKET_STATUS_CHANGED,
                        "Ticket status updated",
                        "Ticket #10: IN_PROGRESS → RESOLVED",
                        10L,
                        ReferenceType.TICKET);
        verifyNoMoreInteractions(notificationService);
    }
}
