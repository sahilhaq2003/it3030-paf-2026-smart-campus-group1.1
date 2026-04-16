package com.smartcampus.notification.listener;

import com.smartcampus.booking.event.BookingStatusChangedEvent;
import com.smartcampus.booking.model.BookingStatus;
import com.smartcampus.notification.model.NotificationType;
import com.smartcampus.notification.model.ReferenceType;
import com.smartcampus.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingEventListener {

    private final NotificationService notificationService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingStatusChanged(BookingStatusChangedEvent event) {
        try {
            NotificationType type = resolveType(event.getNewStatus());
            String title = buildTitle(event.getNewStatus(), event.getFacilityName());
            String message = event.getMessage() != null ? event.getMessage()
                    : buildDefaultMessage(event.getNewStatus(), event.getFacilityName());

            notificationService.createNotification(
                    event.getUserId(),
                    type,
                    title,
                    message,
                    event.getBookingId(),
                    ReferenceType.BOOKING
            );
        } catch (Exception e) {
            log.error("Failed to create booking notification for bookingId={}: {}",
                    event.getBookingId(), e.getMessage(), e);
        }
    }

    private NotificationType resolveType(BookingStatus status) {
        return switch (status) {
            case APPROVED  -> NotificationType.BOOKING_APPROVED;
            case REJECTED  -> NotificationType.BOOKING_REJECTED;
            case CANCELLED -> NotificationType.BOOKING_CANCELLED;
            default        -> NotificationType.BOOKING_CREATED;
        };
    }

    private String buildTitle(BookingStatus status, String facilityName) {
        return switch (status) {
            case APPROVED  -> "Booking Approved – " + facilityName;
            case REJECTED  -> "Booking Rejected – " + facilityName;
            case CANCELLED -> "Booking Cancelled – " + facilityName;
            default        -> "Booking Received – " + facilityName;
        };
    }

    private String buildDefaultMessage(BookingStatus status, String facilityName) {
        return switch (status) {
            case APPROVED  -> "Your booking for " + facilityName + " has been approved.";
            case REJECTED  -> "Your booking for " + facilityName + " has been rejected.";
            case CANCELLED -> "Your booking for " + facilityName + " has been cancelled.";
            default        -> "Your booking request for " + facilityName + " has been received and is pending review.";
        };
    }
}
