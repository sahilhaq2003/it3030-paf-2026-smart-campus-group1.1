package com.smartcampus.maintenance.event;

import com.smartcampus.maintenance.model.enums.TicketStatus;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TicketTechnicianAssignedEvent extends ApplicationEvent {

    private final Long ticketId;
    private final Long ownerId;
    private final Long technicianId;
    private final String technicianName;

    public TicketTechnicianAssignedEvent(
            Object source,
            Long ticketId,
            Long ownerId,
            Long technicianId,
            String technicianName) {
        super(source);
        this.ticketId = ticketId;
        this.ownerId = ownerId;
        this.technicianId = technicianId;
        this.technicianName = technicianName;
    }
}

