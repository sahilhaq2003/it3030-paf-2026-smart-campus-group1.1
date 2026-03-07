package com.smartcampus.maintenance.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class NewCommentEvent extends ApplicationEvent {
    private final Long ticketId;
    private final Long ticketOwnerId;
    private final String commenterName;

    public NewCommentEvent(Object source, Long ticketId, Long ticketOwnerId, String commenterName) {
        super(source);
        this.ticketId = ticketId;
        this.ticketOwnerId = ticketOwnerId;
        this.commenterName = commenterName;
    }
}