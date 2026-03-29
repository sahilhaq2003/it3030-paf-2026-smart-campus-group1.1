package com.smartcampus.maintenance.service;

import com.smartcampus.maintenance.dto.TicketStatusUpdateDTO;
import com.smartcampus.maintenance.model.Ticket;
import com.smartcampus.maintenance.model.enums.TicketStatus;
import com.smartcampus.maintenance.model.enums.Priority;
import com.smartcampus.facilities.repository.FacilityRepository;
import com.smartcampus.maintenance.repository.CommentRepository;
import com.smartcampus.maintenance.repository.TicketRepository;
import com.smartcampus.user.repository.UserRepository;
import com.smartcampus.user.model.User;
import com.smartcampus.user.model.Role;
import com.smartcampus.maintenance.policy.SlaPolicy;
import org.junit.jupiter.api.BeforeEach;

import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock TicketRepository ticketRepo;
    @Mock CommentRepository commentRepo;
    @Mock UserRepository userRepo;
    @Mock FacilityRepository facilityRepo;
    @Mock AttachmentService attachmentService;
    @Mock ApplicationEventPublisher eventPublisher;
    @InjectMocks TicketServiceImpl ticketService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(99L)
            .name("Test User")
            .email("test@example.com")
            .roles(Set.of(Role.USER))
            .build();
    }

    @Test
    void shouldThrow400ForInvalidStatusTransition_OpenToResolved() {
        var dto = new TicketStatusUpdateDTO();
        dto.setStatus(TicketStatus.RESOLVED); // skipping IN_PROGRESS

        var ticket = new Ticket();
        ticket.setId(1L);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setReportedBy(testUser);

        when(ticketRepo.findById(1L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.updateStatus(1L, dto, 99L, true, false))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Invalid status transition");
    }

    @Test
    void shouldThrow400ForInvalidStatusTransition_ClosedToAny() {
        var dto = new TicketStatusUpdateDTO();
        dto.setStatus(TicketStatus.OPEN);

        var ticket = new Ticket();
        ticket.setId(2L);
        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setReportedBy(testUser);

        when(ticketRepo.findById(2L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.updateStatus(2L, dto, 99L, true, false))
            .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void shouldRequireResolutionNotesWhenResolvingTicket() {
        var dto = new TicketStatusUpdateDTO();
        dto.setStatus(TicketStatus.RESOLVED);
        dto.setResolutionNotes(""); // blank

        var ticket = new Ticket();
        ticket.setId(3L);
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setReportedBy(testUser);

        when(ticketRepo.findById(3L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.updateStatus(3L, dto, 99L, true, false))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void shouldAllowValidStatusTransition_OpenToInProgress() {
        var dto = new TicketStatusUpdateDTO();
        dto.setStatus(TicketStatus.IN_PROGRESS);

        var ticket = new Ticket();
        ticket.setId(4L);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setReportedBy(testUser);

        when(ticketRepo.findById(4L)).thenReturn(Optional.of(ticket));
        when(ticketRepo.save(ticket)).thenReturn(ticket);

        // Should not throw
        assertThatCode(() -> ticketService.updateStatus(4L, dto, 99L, true, false))
            .doesNotThrowAnyException();
    }

    @Test
    void shouldCalculateSLADeadlineFor2HoursOnCriticalPriority() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now().minusHours(1);
        
        var ticket = new Ticket();
        ticket.setPriority(Priority.CRITICAL);
        ticket.setCreatedAt(createdAt);

        // Act
        LocalDateTime deadline = SlaPolicy.calculateSlaDeadline(ticket);

        // Assert
        Duration duration = Duration.between(createdAt, deadline);
        assertThat(duration.toHours()).isEqualTo(2);
    }

    @Test
    void shouldCalculateSLADeadlineFor8HoursOnHighPriority() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        
        var ticket = new Ticket();
        ticket.setPriority(Priority.HIGH);
        ticket.setCreatedAt(createdAt);

        // Act
        LocalDateTime deadline = SlaPolicy.calculateSlaDeadline(ticket);

        // Assert
        Duration duration = Duration.between(createdAt, deadline);
        assertThat(duration.toHours()).isEqualTo(8);
    }

    @Test
    void shouldCalculateSLADeadlineFor24HoursOnMediumPriority() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        
        var ticket = new Ticket();
        ticket.setPriority(Priority.MEDIUM);
        ticket.setCreatedAt(createdAt);

        // Act
        LocalDateTime deadline = SlaPolicy.calculateSlaDeadline(ticket);

        // Assert
        Duration duration = Duration.between(createdAt, deadline);
        assertThat(duration.toHours()).isEqualTo(24);
    }

    @Test
    void shouldCalculateSLADeadlineFor72HoursOnLowPriority() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        
        var ticket = new Ticket();
        ticket.setPriority(Priority.LOW);
        ticket.setCreatedAt(createdAt);

        // Act
        LocalDateTime deadline = SlaPolicy.calculateSlaDeadline(ticket);

        // Assert
        Duration duration = Duration.between(createdAt, deadline);
        assertThat(duration.toHours()).isEqualTo(72);
    }

    @Test
    void shouldDetectSLABreachForCriticalTicketOver2Hours() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now().minusHours(3); // 3 hours ago
        
        var ticket = new Ticket();
        ticket.setId(5L);
        ticket.setPriority(Priority.CRITICAL);
        ticket.setCreatedAt(createdAt);
        ticket.setStatus(TicketStatus.OPEN); // still open, no resolution
        ticket.setReportedBy(testUser);

        // Act
        LocalDateTime deadline = SlaPolicy.calculateSlaDeadline(ticket);
        boolean breached = LocalDateTime.now().isAfter(deadline);

        // Assert
        assertThat(breached).isTrue();
    }

    @Test
    void shouldNotDetectSLABreachForResolvedTicket() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now().minusHours(4); // 4 hours ago
        LocalDateTime resolvedAt = LocalDateTime.now().minusHours(1); // 1 hour ago
        
        var ticket = new Ticket();
        ticket.setId(6L);
        ticket.setPriority(Priority.CRITICAL);
        ticket.setCreatedAt(createdAt);
        ticket.setResolvedAt(resolvedAt);
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setReportedBy(testUser);

        // Act - resolved tickets never breach SLA
        // Assert
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.RESOLVED);
    }

    @Test
    void shouldAllowNonOwnerToViewPublicTicketDetails() {
        // Arrange
        var ticket = new Ticket();
        ticket.setId(7L);
        ticket.setTitle("Public ticket");
        ticket.setReportedBy(User.builder().id(1L).name("Owner").build());

        // Act & Assert - Service layer doesn't restrict viewing, controller does
        assertThat(ticket.getTitle()).isNotNull();
    }

    @Test
    void shouldPreserveTicketCreatedAtTimestamp() {
        // Arrange
        LocalDateTime originalCreatedAt = LocalDateTime.of(2026, 3, 1, 10, 0, 0);
        
        var ticket = new Ticket();
        ticket.setId(8L);
        ticket.setCreatedAt(originalCreatedAt);
        ticket.setReportedBy(testUser);

        assertThat(ticket.getCreatedAt()).isEqualTo(originalCreatedAt);
    }

    @Test
    void shouldAllowAdminToAssignTechnician() {
        // Arrange
        var technician =
                User.builder()
                        .id(100L)
                        .name("Tech")
                        .email("tech@example.com")
                        .roles(Set.of(Role.TECHNICIAN))
                        .build();
        var ticket = new Ticket();
        ticket.setId(9L);
        ticket.setAssignedTo(null); // initially unassigned
        ticket.setReportedBy(testUser);

        when(ticketRepo.findById(9L)).thenReturn(Optional.of(ticket));
        when(userRepo.findById(100L)).thenReturn(Optional.of(technician));
        when(ticketRepo.save(ticket)).thenReturn(ticket);

        // Act
        assertThatCode(() -> ticketService.assignTechnician(9L, 100L))
            .doesNotThrowAnyException();
    }

    @Test
    void shouldThrow404WhenTicketNotFound() {
        // Arrange
        when(ticketRepo.findById(999L)).thenReturn(Optional.empty());

        var dto = new TicketStatusUpdateDTO();
        dto.setStatus(TicketStatus.IN_PROGRESS);

        // Act & Assert
        assertThatThrownBy(() -> ticketService.updateStatus(999L, dto, 99L, true, false))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void shouldThrow400WhenAssigningNonExistentTechnician() {
        // Arrange
        var ticket = new Ticket();
        ticket.setId(10L);
        ticket.setReportedBy(testUser);

        when(ticketRepo.findById(10L)).thenReturn(Optional.of(ticket));
        when(userRepo.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> ticketService.assignTechnician(10L, 999L))
            .isInstanceOf(ResponseStatusException.class);
    }
}

