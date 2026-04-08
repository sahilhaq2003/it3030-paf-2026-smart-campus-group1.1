package com.smartcampus.maintenance.service;

import com.smartcampus.maintenance.dto.*;
import com.smartcampus.maintenance.model.enums.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TicketService {

    TicketResponseDTO createTicket(TicketRequestDTO dto, List<MultipartFile> files, Long userId);

    TicketResponseDTO getTicketById(Long id, Long currentUserId, boolean ticketStaff);

    Page<TicketResponseDTO> getMyTickets(Long userId, Pageable pageable);

    Page<TicketResponseDTO> getAllTickets(TicketStatus status, TicketCategory category,
                                          Priority priority, Long assignedToId, Pageable pageable);

    TicketResponseDTO updateStatus(
            Long id, TicketStatusUpdateDTO dto, Long currentUserId, boolean isAdmin, boolean isTechnician);

    TicketResponseDTO assignTechnician(Long id, Long technicianId);

    void deleteTicket(Long id);

    /** Allows the ticket reporter to close a ticket that is already RESOLVED. */
    TicketResponseDTO closeTicket(Long ticketId, Long currentUserId);

    Page<TicketResponseDTO> getTicketsByTechnician(Long techId, Pageable pageable);

    List<TechnicianPerformanceDTO> getTechnicianPerformance();

    byte[] exportTicketsCsv(TicketStatus status, TicketCategory category);
}