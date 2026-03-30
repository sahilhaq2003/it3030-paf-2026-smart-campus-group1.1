package com.smartcampus.facilities.booking.controller;

import com.smartcampus.auth.model.UserPrincipal;
import com.smartcampus.facilities.booking.dto.BookingRequestDTO;
import com.smartcampus.facilities.booking.dto.BookingResponseDTO;
import com.smartcampus.facilities.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponseDTO> create(
            @Valid @RequestBody BookingRequestDTO request, Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request, userId));
    }
}

