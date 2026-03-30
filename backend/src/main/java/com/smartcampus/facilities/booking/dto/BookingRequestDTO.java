package com.smartcampus.facilities.booking.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record BookingRequestDTO(
        @NotNull(message = "facilityId is required") Long facilityId,
        @NotNull(message = "startAt is required") LocalDateTime startAt,
        @NotNull(message = "endAt is required") LocalDateTime endAt
) {}

