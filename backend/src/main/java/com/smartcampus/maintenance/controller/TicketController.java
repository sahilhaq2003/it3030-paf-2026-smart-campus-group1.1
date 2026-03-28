package com.smartcampus.maintenance.controller;

import com.smartcampus.auth.util.Authz;
import com.smartcampus.maintenance.dto.*;
import com.smartcampus.maintenance.model.enums.*;
import com.smartcampus.maintenance.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final AttachmentService attachmentService;

    // GET /api/tickets — ADMIN/TECH only
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<Page<TicketResponseDTO>> getAllTickets(
        @RequestParam(required = false) TicketStatus status,
        @RequestParam(required = false) TicketCategory category,
        @RequestParam(required = false) Priority priority,
        @RequestParam(required = false) Long assignedToId,
        Pageable pageable
    ) {
        return ResponseEntity.ok(
            ticketService.getAllTickets(status, category, priority, assignedToId, pageable));
    }

    // GET /api/tickets/my — current user's tickets
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<TicketResponseDTO>> getMyTickets(
        Authentication auth, Pageable pageable
    ) {
        Long userId = getUserId(auth);
        return ResponseEntity.ok(ticketService.getMyTickets(userId, pageable));
    }

    // GET /api/tickets/{id}
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponseDTO> getTicketById(
        @PathVariable Long id, Authentication auth
    ) {
        Long userId = getUserId(auth);
        return ResponseEntity.ok(ticketService.getTicketById(id, userId, Authz.isTicketStaff(auth)));
    }

    // POST /api/tickets — campus users only (not admin/technician staff)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated() and !hasRole('ADMIN') and !hasRole('TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> createTicket(
        @Valid @RequestPart("ticket") TicketRequestDTO dto,
        @RequestPart(value = "files", required = false) List<MultipartFile> files,
        Authentication auth
    ) {
        Long userId = getUserId(auth);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ticketService.createTicket(dto, files, userId));
    }

    // PATCH /api/tickets/{id}/status
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody TicketStatusUpdateDTO dto,
        Authentication auth
    ) {
        return ResponseEntity.ok(
                ticketService.updateStatus(
                        id,
                        dto,
                        getUserId(auth),
                        Authz.isAdmin(auth),
                        Authz.isTechnician(auth)));
    }

    // PATCH /api/tickets/{id}/assign
    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponseDTO> assignTechnician(
        @PathVariable Long id,
        @RequestParam Long technicianId
    ) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, technicianId));
    }

    // DELETE /api/tickets/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }

    // Technician dashboard endpoint
    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<Page<TicketResponseDTO>> getAssignedTickets(
        Authentication auth, Pageable pageable
    ) {
        return ResponseEntity.ok(ticketService.getTicketsByTechnician(getUserId(auth), pageable));
    }

    private Long getUserId(Authentication auth) {
        // Assumes Principal is your custom UserPrincipal with getId()
        return ((com.smartcampus.auth.model.UserPrincipal) auth.getPrincipal()).getId();
    }
}