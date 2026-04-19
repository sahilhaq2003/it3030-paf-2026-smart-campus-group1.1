package com.smartcampus.booking.dto;

import com.smartcampus.booking.model.BookingStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

//The Full Receipt ,Data flowing OUT to React
@Data
public class BookingResponseDTO {

    private Long id;
    private Long userId;
    private String userName;
    private Long facilityId;
    private String facilityName;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BookingStatus status;
    private String purpose;
    private String rejectionReason;
    private Integer expectedAttendees;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}