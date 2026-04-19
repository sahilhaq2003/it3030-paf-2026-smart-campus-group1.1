package com.smartcampus.booking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

//The Admin's Rejection Note
@Data
public class BookingReviewDTO {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    // Only required when rejecting
    private String rejectionReason;
}