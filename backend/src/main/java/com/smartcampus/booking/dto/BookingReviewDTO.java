package com.smartcampus.booking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingReviewDTO {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    // Only required when rejecting
    private String rejectionReason;
}