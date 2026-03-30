package com.smartcampus.facilities.booking.dto;

import com.smartcampus.facilities.booking.model.BookingStatus;

import java.time.LocalDateTime;

public record BookingResponseDTO(
        Long id,
        Long facilityId,
        Long bookedById,
        LocalDateTime startAt,
        LocalDateTime endAt,
        BookingStatus status,
        LocalDateTime createdAt) {}

