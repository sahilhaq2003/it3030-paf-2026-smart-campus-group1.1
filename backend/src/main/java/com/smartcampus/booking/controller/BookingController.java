package com.smartcampus.booking.controller;

import com.smartcampus.auth.model.UserPrincipal;
import com.smartcampus.booking.dto.BookingRequestDTO;
import com.smartcampus.booking.dto.BookingResponseDTO;
import com.smartcampus.booking.dto.BookingReviewDTO;
import com.smartcampus.booking.dto.PublicBookingDTO;
import com.smartcampus.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // GET /api/bookings — ADMIN only
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponseDTO>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // GET /api/bookings/my — STUDENT, LECTURER(only the logged-in user's bookings)
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER', 'LECTURER')")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.getMyBookings(principal.getId()));
    }

    // GET /api/bookings/{id} — STUDENT, LECTURER, ADMIN
    //Returns a single booking by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'LECTURER', 'ADMIN')")
    public ResponseEntity<BookingResponseDTO> getBookingById(
            @PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    // GET /api/bookings/availability — STUDENT, LECTURER
    @GetMapping("/availability")
    @PreAuthorize("hasAnyRole('USER', 'LECTURER')")
    public ResponseEntity<Boolean> checkAvailability(
            @RequestParam Long facilityId,
            @RequestParam LocalDate date,
            @RequestParam LocalTime startTime,
            @RequestParam LocalTime endTime,
            @RequestParam(required = false) Long excludeBookingId) {
        return ResponseEntity.ok(
                bookingService.isAvailable(facilityId, date, startTime, endTime, excludeBookingId));
    }

    // POST /api/bookings — STUDENT, LECTURER
    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'LECTURER')")
    public ResponseEntity<BookingResponseDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO request,
            @AuthenticationPrincipal UserPrincipal principal) {
        BookingResponseDTO response = bookingService.createBooking(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
        // PUT /api/bookings/{id} — Allow Students and Lecturers to update their booking
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'LECTURER')")
    public ResponseEntity<BookingResponseDTO> updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingRequestDTO request,
            @AuthenticationPrincipal UserPrincipal principal) {
        BookingResponseDTO response = bookingService.updateBooking(id, request, principal.getId());
        return ResponseEntity.ok(response);
    }


    // PATCH /api/bookings/{id}/approve — ADMIN only
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> approveBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.approveBooking(id, principal.getId()));
    }

    // PATCH /api/bookings/{id}/reject — ADMIN only
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> rejectBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingReviewDTO review,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, review, principal.getId()));
    }

    // PATCH /api/bookings/{id}/cancel — STUDENT, LECTURER, ADMIN
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER', 'LECTURER', 'ADMIN')")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, principal.getId()));
    }

    // DELETE /api/bookings/{id} — ADMIN only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/bookings/analytics — ADMIN only
@GetMapping("/analytics")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<Map<String, Object>> getAnalytics() {
    return ResponseEntity.ok(bookingService.getAnalytics());
}

// public endpoint that returns booking details without requiring login, used by the QR verification page
@GetMapping("/public/{id}")
public ResponseEntity<PublicBookingDTO> getPublicBooking(@PathVariable Long id) {
    BookingResponseDTO full = bookingService.getBookingById(id);
    PublicBookingDTO pub = new PublicBookingDTO();
    pub.setId(full.getId());
    pub.setStatus(full.getStatus());
    pub.setFacilityName(full.getFacilityName());
    pub.setPurpose(full.getPurpose());
    pub.setBookingDate(full.getBookingDate());
    pub.setStartTime(full.getStartTime());
    pub.setEndTime(full.getEndTime());
    return ResponseEntity.ok(pub);
}
}