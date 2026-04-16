package com.smartcampus.booking.event;

import com.smartcampus.booking.model.BookingStatus;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class BookingStatusChangedEvent extends ApplicationEvent {

    private final Long bookingId;
    private final Long userId;
    private final BookingStatus oldStatus;
    private final BookingStatus newStatus;
    private final String facilityName;
    private final String message;

    public BookingStatusChangedEvent(Object source,
                                     Long bookingId,
                                     Long userId,
                                     BookingStatus oldStatus,
                                     BookingStatus newStatus,
                                     String facilityName,
                                     String message) {
        super(source);
        this.bookingId = bookingId;
        this.userId = userId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.facilityName = facilityName;
        this.message = message;
    }
}