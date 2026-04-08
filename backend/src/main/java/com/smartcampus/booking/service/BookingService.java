package com.smartcampus.booking.service;

import com.smartcampus.booking.dto.BookingRequestDTO;
import com.smartcampus.booking.dto.BookingResponseDTO;
import com.smartcampus.booking.dto.BookingReviewDTO;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingService {

    // Create a new booking
    BookingResponseDTO createBooking(BookingRequestDTO request, Long userId);

    // Get all bookings — ADMIN only
    List<BookingResponseDTO> getAllBookings();

    // Get bookings for a specific user
    List<BookingResponseDTO> getMyBookings(Long userId);

    // Get a single booking by ID
    BookingResponseDTO getBookingById(Long bookingId);

    // Check availability
    boolean isAvailable(Long facilityId, LocalDate date,
                        LocalTime startTime, LocalTime endTime);

    // Approve a booking — ADMIN only
    BookingResponseDTO approveBooking(Long bookingId, Long adminId);

    // Reject a booking — ADMIN only
    BookingResponseDTO rejectBooking(Long bookingId, BookingReviewDTO review, Long adminId);

    // Cancel a booking
    BookingResponseDTO cancelBooking(Long bookingId, Long userId);

    // Delete a booking — ADMIN only
    void deleteBooking(Long bookingId);
}