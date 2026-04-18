package com.smartcampus.maintenance.service;

import com.smartcampus.maintenance.dto.*;
import com.smartcampus.maintenance.event.TicketStatusChangedEvent;
import com.smartcampus.maintenance.event.TicketSubmittedEvent;
import com.smartcampus.maintenance.event.TicketTechnicianAssignedEvent;
import com.smartcampus.maintenance.model.*;
import com.smartcampus.maintenance.model.enums.*;
import com.smartcampus.maintenance.policy.SlaPolicy;
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

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepo;
    private final UserRepository userRepo;
    private final FacilityRepository facilityRepo;
    private final AttachmentService attachmentService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public TicketResponseDTO createTicket(TicketRequestDTO dto, List<MultipartFile> files, Long userId) {
        // Fetch the user creating the ticket; throw NOT_FOUND if user doesn't exist
        var user = userRepo.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found"));

        // Build ticket with basic information from DTO
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

        // Associate facility if provided
        if (dto.getFacilityId() != null) {
            var facility = facilityRepo.findById(dto.getFacilityId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Facility not found. Please select a valid facility."));
            ticket.setFacility(facility);
        }

        var saved = ticketRepo.save(ticket);
        
        // Calculate and set SLA deadline based on priority
        if (saved.getCreatedAt() != null && saved.getPriority() != null) {
            saved.setSlaDeadline(
                    saved.getCreatedAt().plusHours(SlaPolicy.hoursFor(saved.getPriority())));
            saved = ticketRepo.save(saved);
        }

        // Handle file attachments
        if (files != null && !files.isEmpty()) {
            var attachments = attachmentService.saveAttachments(files, saved);
            saved.setAttachments(attachments);
        }

        // Notify the ticket owner immediately on submission (for both in-app + email notifications).
        eventPublisher.publishEvent(
                new TicketSubmittedEvent(
                        this, saved.getId(), user.getId(), saved.getTitle()));

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
    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> searchTickets(String keyword, Pageable pageable) {
        if (keyword == null || keyword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Search keyword cannot be empty. Please provide a search term to find tickets.");
        }
        
        if (keyword.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Search keyword must be at least 2 characters long.");
        }
        
        if (keyword.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Search keyword cannot exceed 100 characters.");
        }
        
        return ticketRepo.searchByKeyword(keyword, pageable).map(this::mapToResponse);
    }

    @Override
    public TicketResponseDTO updateStatus(
            Long id, TicketStatusUpdateDTO dto, Long currentUserId, boolean isAdmin, boolean isTechnician) {
        // Retrieve ticket; throw NOT_FOUND (404) if not found
        var ticket = findTicketOrThrow(id);
        
        if (dto == null || dto.getStatus() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Status is required. Please provide a valid ticket status.");
        }

        // Validate permissions: technicians can only update assigned tickets
        if (isTechnician && !isAdmin) {
            if (ticket.getAssignedTo() == null
                    || !ticket.getAssignedTo().getId().equals(currentUserId)) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Access denied. Only the assigned technician can update this ticket. If you believe this is an error, contact your administrator.");
            }
            // Technicians must mark tickets as RESOLVED with notes, not CLOSED (auto-closes after resolution)
            if (dto.getStatus() == TicketStatus.CLOSED) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Technicians cannot directly close tickets. Mark tickets as RESOLVED with resolution notes instead. Tickets automatically close after the resolution period has ended.");
            }
        }

        // Validate the status transition is allowed
        validateStatusTransition(ticket.getStatus(), dto.getStatus());

        // Require resolution notes when marking as RESOLVED
        if (dto.getStatus() == TicketStatus.RESOLVED) {
            if (dto.getResolutionNotes() == null || dto.getResolutionNotes().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Resolution notes are required when marking a ticket as RESOLVED. Please provide details about how the issue was resolved.");
            }
            ticket.setResolutionNotes(dto.getResolutionNotes());
            ticket.setResolvedAt(LocalDateTime.now());
        }

        // Require rejection reason when marking as REJECTED
        if (dto.getStatus() == TicketStatus.REJECTED) {
            if (dto.getRejectionReason() == null || dto.getRejectionReason().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Rejection reason is required when rejecting a ticket");
            }
            ticket.setRejectionReason(dto.getRejectionReason());
        }

        var previousStatus = ticket.getStatus();
        // Persist the exact requested status so DB transition rules remain valid.
        TicketStatus persistedStatus = dto.getStatus();
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
        // Verify ticket exists
        var ticket = findTicketOrThrow(id);
        
        // Verify technician ID is valid
        if (technicianId == null || technicianId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Invalid technician ID. Please provide a valid positive integer.");
        }
        
        // Verify technician exists and is valid
        var tech = userRepo.findById(technicianId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                String.format("Technician with ID %d not found. Please verify the technician ID and ensure the user exists in the system.", technicianId)));

        ticket.setAssignedTo(tech);

        // Auto-move to IN_PROGRESS when assigned to better reflect ticket workflow
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        var saved = ticketRepo.save(ticket);

        // Notify ticket owner (student) that a technician has been assigned.
        if (saved.getReportedBy() != null && saved.getReportedBy().getId() != null) {
            eventPublisher.publishEvent(
                    new TicketTechnicianAssignedEvent(
                            this,
                            saved.getId(),
                            saved.getReportedBy().getId(),
                            tech.getId(),
                            tech.getName()));
        }

        return mapToResponse(saved);
    }

    @Override
    public void deleteTicket(Long id) {
        var ticket = findTicketOrThrow(id);
        
        // Prevent deletion of resolved or closed tickets
        if (ticket.getStatus() == TicketStatus.CLOSED || ticket.getStatus() == TicketStatus.RESOLVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cannot delete a ticket that has been resolved or closed. Please contact an administrator if you need to remove this ticket.");
        }
        
        // Clean up attachment files from storage
        attachmentService.deleteAttachments(ticket.getAttachments());
        ticketRepo.delete(ticket);
    }

    @Override
    public TicketResponseDTO closeTicket(Long ticketId, Long currentUserId) {
        var ticket = findTicketOrThrow(ticketId);

        // Only the reporter may close their own ticket
        if (!ticket.getReportedBy().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Access denied. Only the person who reported this ticket can close it. Contact the ticket reporter or an administrator.");
        }

        // Ticket must be in RESOLVED state before a user can close it
        if (ticket.getStatus() != TicketStatus.RESOLVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                String.format(
                    "Cannot close ticket. Only tickets with RESOLVED status can be closed by the reporter. Current status: %s. Please mark the ticket as resolved first or contact a technician.",
                    ticket.getStatus()));
        }

        var previousStatus = ticket.getStatus();
        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setClosedAt(LocalDateTime.now());
        var saved = ticketRepo.save(ticket);

        eventPublisher.publishEvent(
                new TicketStatusChangedEvent(
                        this,
                        saved.getId(),
                        saved.getReportedBy().getId(),
                        previousStatus,
                        TicketStatus.CLOSED));

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponseDTO> getTicketsByTechnician(Long techId, Pageable pageable) {
        if (techId == null || techId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Invalid technician ID. Please provide a valid positive integer.");
        }
        
        // Verify technician exists
        userRepo.findById(techId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                String.format("Technician with ID %d not found. Please verify the technician ID.", techId)));
        
        return ticketRepo.findByAssignedToId(techId, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TechnicianPerformanceDTO> getTechnicianPerformance() {
        return ticketRepo.aggregateTechnicianPerformance().stream()
                .map(TicketServiceImpl::mapTechnicianPerformanceRow)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportTicketsCsv(TicketStatus status, TicketCategory category) {
        List<Ticket> tickets = ticketRepo.findAllForExport(status, category);
        CSVFormat fmt = CSVFormat.DEFAULT.builder()
                .setHeader(
                        "id",
                        "title",
                        "description",
                        "status",
                        "category",
                        "priority",
                        "location",
                        "facilityName",
                        "reportedBy",
                        "assignedTo",
                        "createdAt",
                        "updatedAt",
                        "resolvedAt",
                        "slaDeadline")
                .build();
        try (var out = new ByteArrayOutputStream();
                var writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
                var printer = new CSVPrinter(writer, fmt)) {
            for (Ticket t : tickets) {
                printer.printRecord(
                        t.getId(),
                        t.getTitle(),
                        t.getDescription(),
                        t.getStatus(),
                        t.getCategory(),
                        t.getPriority(),
                        t.getLocation(),
                        t.getFacility() != null ? t.getFacility().getName() : "",
                        t.getReportedBy() != null ? t.getReportedBy().getName() : "",
                        t.getAssignedTo() != null ? t.getAssignedTo().getName() : "",
                        t.getCreatedAt(),
                        t.getUpdatedAt(),
                        t.getResolvedAt(),
                        t.getSlaDeadline());
            }
            printer.flush();
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static TechnicianPerformanceDTO mapTechnicianPerformanceRow(Object[] row) {
        Long techId = row[0] == null ? null : ((Number) row[0]).longValue();
        String name = row[1] != null ? row[1].toString() : "";
        long count = row[2] == null ? 0L : ((Number) row[2]).longValue();
        Double avgHours = row[3] == null ? null : ((Number) row[3]).doubleValue();
        return TechnicianPerformanceDTO.builder()
                .technicianId(techId)
                .technicianName(name)
                .ticketsResolved(count)
                .avgResolutionHours(avgHours)
                .build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static String attachmentPublicOrApiUrl(Long ticketId, Attachment a) {
        if (a.getFileUrl() != null && !a.getFileUrl().isBlank()) {
            return a.getFileUrl();
        }
        return "/api/tickets/" + ticketId + "/attachments/" + a.getStoredName();
    }

    /** Effective SLA deadline: persisted value or derived from createdAt + priority (no @PostLoad — avoids dirty state on read-only txs). */
    private static LocalDateTime effectiveSlaDeadline(Ticket t) {
        if (t.getSlaDeadline() != null) {
            return t.getSlaDeadline();
        }
        if (t.getCreatedAt() != null && t.getPriority() != null) {
            return t.getCreatedAt().plusHours(SlaPolicy.hoursFor(t.getPriority()));
        }
        return null;
    }

    private static boolean computeSlaViolated(Ticket t, LocalDateTime now) {
        LocalDateTime deadline = effectiveSlaDeadline(t);
        if (deadline == null) {
            return false;
        }
        if (t.getResolvedAt() != null) {
            return t.getResolvedAt().isAfter(deadline);
        }
        return now.isAfter(deadline);
    }

    private Ticket findTicketOrThrow(Long id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Invalid ticket ID. Please provide a valid positive integer.");
        }
        return ticketRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                String.format(
                    "Ticket #%d not found. The ticket may have been deleted or does not exist in the system. Please check the ticket ID and try again.",
                    id)));
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
                "Cannot transition ticket from " + current + " to " + next + 
                ". Valid transitions: OPEN→IN_PROGRESS, OPEN→REJECTED, IN_PROGRESS→RESOLVED, " +
                "IN_PROGRESS→REJECTED, RESOLVED→CLOSED");
        }
    }

    private TicketResponseDTO mapToResponse(Ticket t) {
        LocalDateTime now = LocalDateTime.now();
        long timeElapsed =
                t.getCreatedAt() == null ? 0L : ChronoUnit.HOURS.between(t.getCreatedAt(), now);
        boolean slaViolated = computeSlaViolated(t, now);
        List<Attachment> attachmentList =
                t.getAttachments() == null ? Collections.emptyList() : t.getAttachments();

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
            .attachments(attachmentList.stream().map(a -> AttachmentDTO.builder()
                .id(a.getId())
                .originalName(a.getOriginalName())
                .url(attachmentPublicOrApiUrl(t.getId(), a))
                .mimeType(a.getMimeType())
                .size(a.getSize())
                .uploadDate(a.getUploadDate())
                .build()).toList())
            .createdAt(t.getCreatedAt())
            .updatedAt(t.getUpdatedAt())
            .resolvedAt(t.getResolvedAt())
            .closedAt(t.getClosedAt())
            .slaDeadline(effectiveSlaDeadline(t))
            .slaViolated(slaViolated)
            .timeElapsed(timeElapsed)
            .build();
    }
}