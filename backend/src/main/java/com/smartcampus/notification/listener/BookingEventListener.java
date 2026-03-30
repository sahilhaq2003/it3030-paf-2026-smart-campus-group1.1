package com.smartcampus.notification.listener;

import org.springframework.stereotype.Component;

/**
 * Placeholder for booking-domain notifications ({@link com.smartcampus.notification.model.NotificationType#BOOKING_APPROVED},
 * {@link com.smartcampus.notification.model.NotificationType#BOOKING_REJECTED}).
 * <p>
 * There is no booking module publishing {@link org.springframework.context.ApplicationEvent}s yet
 * (see {@code FacilityServiceImpl} booking integration TODO). Add {@code @EventListener} methods here
 * when events such as booking approved/rejected are published.
 */
@Component
public class BookingEventListener {
    // Intentionally empty until booking events exist.
}
