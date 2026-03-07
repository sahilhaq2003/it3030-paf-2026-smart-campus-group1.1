package com.smartcampus.maintenance.event;

import com.smartcampus.maintenance.model.enums.TicketStatus;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TicketStatusChangedEvent extends ApplicationEvent {
    private final Long ticketId;
    private final Long ownerId;
    private final TicketStatus previousStatus;
    private final TicketStatus newStatus;

    public TicketStatusChangedEvent(Object source, Long ticketId, Long ownerId,
                                     TicketStatus previousStatus, TicketStatus newStatus) {
        super(source);
        this.ticketId = ticketId;
        this.ownerId = ownerId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
    }
}