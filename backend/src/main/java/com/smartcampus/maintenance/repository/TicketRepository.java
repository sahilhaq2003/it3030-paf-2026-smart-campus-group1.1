package com.smartcampus.maintenance.repository;

import com.smartcampus.maintenance.model.Ticket;
import com.smartcampus.maintenance.model.enums.Priority;
import com.smartcampus.maintenance.model.enums.TicketCategory;
import com.smartcampus.maintenance.model.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Page<Ticket> findByReportedById(Long userId, Pageable pageable);

    @Query("""
        SELECT t FROM Ticket t
        WHERE (:status IS NULL OR t.status = :status)
          AND (:category IS NULL OR t.category = :category)
          AND (:priority IS NULL OR t.priority = :priority)
          AND (:assignedToId IS NULL OR t.assignedTo.id = :assignedToId)
    """)
    Page<Ticket> findWithFilters(
        @Param("status") TicketStatus status,
        @Param("category") TicketCategory category,
        @Param("priority") Priority priority,
        @Param("assignedToId") Long assignedToId,
        Pageable pageable
    );

    // For SLA escalation job
    @Query("""
        SELECT t FROM Ticket t
        WHERE t.status = com.smartcampus.maintenance.model.enums.TicketStatus.OPEN
          AND t.priority = :priority
          AND t.createdAt < :before
    """)
    List<Ticket> findOpenTicketsBefore(
        @Param("priority") Priority priority,
        @Param("before") LocalDateTime before
    );

    Page<Ticket> findByAssignedToId(Long techId, Pageable pageable);

    @Query("""
        SELECT DISTINCT t FROM Ticket t
        LEFT JOIN FETCH t.reportedBy
        LEFT JOIN FETCH t.assignedTo
        LEFT JOIN FETCH t.facility
        WHERE (:status IS NULL OR t.status = :status)
          AND (:category IS NULL OR t.category = :category)
        ORDER BY t.id ASC
        """)
    List<Ticket> findAllForExport(
        @Param("status") TicketStatus status,
        @Param("category") TicketCategory category
    );

    @Query(
            value = """
                    SELECT t.assigned_to AS technician_id, u.name AS technician_name, COUNT(t.id) AS tickets_resolved,
                           AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600.0) AS avg_resolution_hours
                    FROM tickets t
                    INNER JOIN users u ON u.id = t.assigned_to
                    WHERE t.status = 'CLOSED'
                      AND t.resolved_at IS NOT NULL
                      AND t.assigned_to IS NOT NULL
                    GROUP BY t.assigned_to, u.name
                    ORDER BY COUNT(t.id) DESC
                    """,
            nativeQuery = true)
    List<Object[]> aggregateTechnicianPerformance();
}