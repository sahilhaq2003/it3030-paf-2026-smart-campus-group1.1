package com.smartcampus.maintenance.policy;

import com.smartcampus.maintenance.model.Ticket;
import com.smartcampus.maintenance.model.enums.Priority;

import java.time.LocalDateTime;

/**
 * SLA target hours from ticket creation: CRITICAL 2h, HIGH 8h, MEDIUM 24h, LOW 72h.
 */
public final class SlaPolicy {

    private SlaPolicy() {}

    public static int hoursFor(Priority priority) {
        if (priority == null) {
            return 72;
        }
        return switch (priority) {
            case CRITICAL -> 2;
            case HIGH -> 8;
            case MEDIUM -> 24;
            case LOW -> 72;
        };
    }

    /** Absolute SLA deadline from ticket creation time and priority. */
    public static LocalDateTime calculateSlaDeadline(Ticket ticket) {
        if (ticket == null || ticket.getCreatedAt() == null) {
            throw new IllegalArgumentException("ticket and createdAt are required");
        }
        return ticket.getCreatedAt().plusHours(hoursFor(ticket.getPriority()));
    }
}
