package com.smartcampus.maintenance.service;

import com.smartcampus.maintenance.dto.*;
import com.smartcampus.maintenance.event.TicketStatusChangedEvent;
import com.smartcampus.maintenance.model.*;
import com.smartcampus.maintenance.model.enums.*;
import com.smartcampus.maintenance.repository.*;
import com.smartcampus.user.repository.UserRepository;
import com.smartcampus.facilities.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepo;
    private final CommentRepository commentRepo;
    private final UserRepository userRepo;
    private final FacilityRepository facilityRepo;
    private final AttachmentService attachmentService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public TicketResponseDTO createTicket(TicketRequestDTO dto, List<MultipartFile> files, Long userId) {
        var user = userRepo.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        var ticket = Ticket.builder()
            .title(dto.getTitle())
            .description(dto.getDescription())
            .category(dto.getCategory())
            .priority(dto.getPriority())
            .location(dto.getLocation())
            .preferredContact(dto.getPreferredContact())
            .status(TicketStatus.OPEN)
            .reportedBy(user)
            .build();

        if (dto.getFacilityId() != null) {
            var facility = facilityRepo.findById(dto.getFacilityId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Facility not found"));
            ticket.setFacility(facility);
        }

        var saved = ticketRepo.save(ticket);

        // Handle file attachments
        if (files != null && !files.isEmpty()) {
            var attachments = attachmentService.saveAttachments(files, saved);
            saved.setAttachments(attachments);
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponseDTO getTicketById(Long id, Long currentUserId, boolean ticketStaff) {
        var ticket = findTicketOrThrow(id);

        if (!ticketStaff && !ticket.getReportedBy().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return mapToResponse(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> getMyTickets(Long userId, Pageable pageable) {
        return ticketRepo.findByReportedById(userId, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> getAllTickets(TicketStatus status, TicketCategory category,
                                                  Priority priority, Long assignedToId, Pageable pageable) {
        return ticketRepo.findWithFilters(status, category, priority, assignedToId, pageable)
            .map(this::mapToResponse);
    }

    @Override
    public TicketResponseDTO updateStatus(
            Long id, TicketStatusUpdateDTO dto, Long currentUserId, boolean isAdmin, boolean isTechnician) {
        var ticket = findTicketOrThrow(id);

        if (isTechnician && !isAdmin) {
            if (ticket.getAssignedTo() == null
                    || !ticket.getAssignedTo().getId().equals(currentUserId)) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Only the technician assigned to this ticket can update its status");
            }
            if (dto.getStatus() == TicketStatus.CLOSED) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Use Resolved with resolution notes to finish this ticket. "
                                + "It closes automatically — only admins can archive legacy tickets as Closed.");
            }
        }

        validateStatusTransition(ticket.getStatus(), dto.getStatus());

        if (dto.getStatus() == TicketStatus.RESOLVED) {
            if (dto.getResolutionNotes() == null || dto.getResolutionNotes().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resolution notes required");
            }
            ticket.setResolutionNotes(dto.getResolutionNotes());
            ticket.setResolvedAt(LocalDateTime.now());
        }

        if (dto.getStatus() == TicketStatus.REJECTED) {
            if (dto.getRejectionReason() == null || dto.getRejectionReason().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason required");
            }
            ticket.setRejectionReason(dto.getRejectionReason());
        }

        var previousStatus = ticket.getStatus();
        // Resolve completes the lifecycle in one step (no extra admin RESOLVED → CLOSED action).
        TicketStatus persistedStatus =
                dto.getStatus() == TicketStatus.RESOLVED ? TicketStatus.CLOSED : dto.getStatus();
        ticket.setStatus(persistedStatus);
        var saved = ticketRepo.save(ticket);

        eventPublisher.publishEvent(
                new TicketStatusChangedEvent(
                        this,
                        saved.getId(),
                        saved.getReportedBy().getId(),
                        previousStatus,
                        persistedStatus));

        return mapToResponse(saved);
    }

    @Override
    public TicketResponseDTO assignTechnician(Long id, Long technicianId) {
        var ticket = findTicketOrThrow(id);
        var tech = userRepo.findById(technicianId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Technician not found"));

        ticket.setAssignedTo(tech);

        // Auto-move to IN_PROGRESS when assigned
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        return mapToResponse(ticketRepo.save(ticket));
    }

    @Override
    public void deleteTicket(Long id) {
        var ticket = findTicketOrThrow(id);
        // Clean up attachment files from disk
        attachmentService.deleteAttachments(ticket.getAttachments());
        ticketRepo.delete(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> getTicketsByTechnician(Long techId, Pageable pageable) {
        return ticketRepo.findByAssignedToId(techId, pageable).map(this::mapToResponse);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Ticket findTicketOrThrow(Long id) {
        return ticketRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
    }

    private void validateStatusTransition(TicketStatus current, TicketStatus next) {
        boolean valid = switch (current) {
            case OPEN -> next == TicketStatus.IN_PROGRESS || next == TicketStatus.REJECTED;
            case IN_PROGRESS -> next == TicketStatus.RESOLVED || next == TicketStatus.REJECTED;
            case RESOLVED -> next == TicketStatus.CLOSED;
            case CLOSED, REJECTED -> false;
        };
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Invalid status transition: " + current + " → " + next);
        }
    }

    private TicketResponseDTO mapToResponse(Ticket t) {
        return TicketResponseDTO.builder()
            .id(t.getId())
            .title(t.getTitle())
            .description(t.getDescription())
            .category(t.getCategory())
            .priority(t.getPriority())
            .location(t.getLocation())
            .facilityId(t.getFacility() != null ? t.getFacility().getId() : null)
            .facilityName(t.getFacility() != null ? t.getFacility().getName() : null)
            .status(t.getStatus())
            .reportedById(t.getReportedBy().getId())
            .reportedByName(t.getReportedBy().getName())
            .assignedToId(t.getAssignedTo() != null ? t.getAssignedTo().getId() : null)
            .assignedToName(t.getAssignedTo() != null ? t.getAssignedTo().getName() : null)
            .resolutionNotes(t.getResolutionNotes())
            .rejectionReason(t.getRejectionReason())
            .preferredContact(t.getPreferredContact())
            .attachments(t.getAttachments().stream().map(a -> AttachmentDTO.builder()
                .id(a.getId())
                .originalName(a.getOriginalName())
                .url("/api/tickets/" + t.getId() + "/attachments/" + a.getStoredName())
                .mimeType(a.getMimeType())
                .size(a.getSize())
                .build()).toList())
            .createdAt(t.getCreatedAt())
            .updatedAt(t.getUpdatedAt())
            .resolvedAt(t.getResolvedAt())
            .build();
    }
}