package com.smartcampus.booking.dto;

import com.smartcampus.booking.model.BookingStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class PublicBookingDTO {
    private Long id;
    private BookingStatus status;
    private String facilityName;
    private String purpose;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
}
