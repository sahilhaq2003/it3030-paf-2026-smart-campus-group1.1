package com.smartcampus.maintenance.service;

import com.smartcampus.maintenance.dto.TicketStatusUpdateDTO;
import com.smartcampus.maintenance.model.Ticket;
import com.smartcampus.maintenance.model.enums.TicketStatus;
import com.smartcampus.facilities.repository.FacilityRepository;
import com.smartcampus.maintenance.repository.CommentRepository;
import com.smartcampus.maintenance.repository.TicketRepository;
import com.smartcampus.user.repository.UserRepository;
import com.smartcampus.user.model.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
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

    @Test
    void shouldThrow400ForInvalidStatusTransition_OpenToResolved() {
        var dto = new TicketStatusUpdateDTO();
        dto.setStatus(TicketStatus.RESOLVED); // skipping IN_PROGRESS

        var ticket = new Ticket();
        ticket.setId(1L);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setReportedBy(User.builder().id(99L).name("Test").build());

        when(ticketRepo.findById(1L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.updateStatus(1L, dto, 99L))
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
        ticket.setReportedBy(User.builder().id(99L).name("Test").build());

        when(ticketRepo.findById(2L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.updateStatus(2L, dto, 99L))
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
        ticket.setReportedBy(User.builder().id(99L).name("Test").build());

        when(ticketRepo.findById(3L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.updateStatus(3L, dto, 99L))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
