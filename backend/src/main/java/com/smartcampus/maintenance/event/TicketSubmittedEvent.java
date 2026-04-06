package com.smartcampus.maintenance.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TicketSubmittedEvent extends ApplicationEvent {
    private final Long ticketId;
    private final Long ownerId;
    private final String title;

    public TicketSubmittedEvent(
            Object source, Long ticketId, Long ownerId, String title) {
        super(source);
        this.ticketId = ticketId;
        this.ownerId = ownerId;
        this.title = title;
    }
}

