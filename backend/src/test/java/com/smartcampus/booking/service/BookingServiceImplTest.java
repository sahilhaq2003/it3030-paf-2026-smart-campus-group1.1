package com.smartcampus.booking.service;

import com.smartcampus.booking.dto.BookingReviewDTO;
import com.smartcampus.booking.dto.BookingResponseDTO;
import com.smartcampus.booking.event.BookingStatusChangedEvent;
import com.smartcampus.booking.model.Booking;
import com.smartcampus.booking.model.BookingStatus;
import com.smartcampus.booking.repository.BookingRepository;
import com.smartcampus.facilities.model.Facility;
import com.smartcampus.facilities.repository.FacilityRepository;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private FacilityRepository facilityRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private BookingQrEmailService bookingQrEmailService;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private Booking pendingBooking;
    private User user;
    private Facility facility;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setName("Test User");
        user.setEmail("test@example.com");

        facility = new Facility();
        facility.setId(1L);
        facility.setName("Conference Room");

        pendingBooking = Booking.builder()
                .id(10L)
                .user(user)
                .facility(facility)
                .bookingDate(LocalDate.of(2026, 5, 1))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(11, 0))
                .status(BookingStatus.PENDING)
                .purpose("Team Meeting")
                .expectedAttendees(5)
                .build();
    }

    // ─── Approve Tests ────────────────────────────────────────────────────────

    @Test
    void approveBooking_whenPending_changesStatusToApproved() {
        when(bookingRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(pendingBooking));
        when(bookingRepository.save(any(Booking.class)))
                .thenReturn(pendingBooking);
        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user));

        BookingResponseDTO result = bookingService.approveBooking(10L, 99L);

        assertEquals(BookingStatus.APPROVED, pendingBooking.getStatus());
        verify(bookingRepository).save(pendingBooking);
        verify(eventPublisher).publishEvent(any(BookingStatusChangedEvent.class));
    }

    @Test
    void approveBooking_whenNotPending_throwsException() {
        pendingBooking.setStatus(BookingStatus.APPROVED);
        when(bookingRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(pendingBooking));

        assertThrows(IllegalStateException.class,
                () -> bookingService.approveBooking(10L, 99L));
    }

    @Test
    void approveBooking_whenBookingNotFound_throwsEntityNotFoundException() {
        when(bookingRepository.findByIdWithDetails(99L))
                .thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> bookingService.approveBooking(99L, 1L));
    }

    // ─── Reject Tests ─────────────────────────────────────────────────────────

    @Test
    void rejectBooking_whenPending_changesStatusToRejected() {
        BookingReviewDTO review = new BookingReviewDTO();
        review.setRejectionReason("Facility unavailable");

        when(bookingRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(pendingBooking));
        when(bookingRepository.save(any(Booking.class)))
                .thenReturn(pendingBooking);

        bookingService.rejectBooking(10L, review, 99L);

        assertEquals(BookingStatus.REJECTED, pendingBooking.getStatus());
        assertEquals("Facility unavailable", pendingBooking.getRejectionReason());
        verify(eventPublisher).publishEvent(any(BookingStatusChangedEvent.class));
    }

    @Test
    void rejectBooking_whenNotPending_throwsException() {
        pendingBooking.setStatus(BookingStatus.APPROVED);
        BookingReviewDTO review = new BookingReviewDTO();
        review.setRejectionReason("reason");

        when(bookingRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(pendingBooking));

        assertThrows(IllegalStateException.class,
                () -> bookingService.rejectBooking(10L, review, 99L));
    }

    // ─── Cancel Tests ─────────────────────────────────────────────────────────

    @Test
    void cancelBooking_whenPending_changesStatusToCancelled() {
        when(bookingRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(pendingBooking));
        when(bookingRepository.save(any(Booking.class)))
                .thenReturn(pendingBooking);

        bookingService.cancelBooking(10L, 1L);

        assertEquals(BookingStatus.CANCELLED, pendingBooking.getStatus());
        verify(eventPublisher).publishEvent(any(BookingStatusChangedEvent.class));
    }

    @Test
    void cancelBooking_whenApproved_changesStatusToCancelled() {
        pendingBooking.setStatus(BookingStatus.APPROVED);
        when(bookingRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(pendingBooking));
        when(bookingRepository.save(any(Booking.class)))
                .thenReturn(pendingBooking);

        bookingService.cancelBooking(10L, 1L);

        assertEquals(BookingStatus.CANCELLED, pendingBooking.getStatus());
    }

    @Test
    void cancelBooking_whenAlreadyCancelled_throwsException() {
        pendingBooking.setStatus(BookingStatus.CANCELLED);
        when(bookingRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(pendingBooking));

        assertThrows(IllegalStateException.class,
                () -> bookingService.cancelBooking(10L, 1L));
    }

    @Test
    void cancelBooking_whenRejected_throwsException() {
        pendingBooking.setStatus(BookingStatus.REJECTED);
        when(bookingRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(pendingBooking));

        assertThrows(IllegalStateException.class,
                () -> bookingService.cancelBooking(10L, 1L));
    }

    @Test
    void cancelBooking_whenDifferentUser_throwsAccessDeniedException() {
        when(bookingRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(pendingBooking));

        assertThrows(AccessDeniedException.class,
                () -> bookingService.cancelBooking(10L, 999L));
    }

    // ─── Delete Tests ─────────────────────────────────────────────────────────

    @Test
    void deleteBooking_whenExists_deletesSuccessfully() {
        when(bookingRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(pendingBooking));

        bookingService.deleteBooking(10L);

        verify(bookingRepository).delete(pendingBooking);
    }

    @Test
    void deleteBooking_whenNotFound_throwsEntityNotFoundException() {
        when(bookingRepository.findByIdWithDetails(99L))
                .thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> bookingService.deleteBooking(99L));
    }

    // ─── GetById Tests ────────────────────────────────────────────────────────

    @Test
    void getBookingById_whenExists_returnsDTO() {
        when(bookingRepository.findByIdWithDetails(10L))
                .thenReturn(Optional.of(pendingBooking));

        BookingResponseDTO result = bookingService.getBookingById(10L);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("Conference Room", result.getFacilityName());
    }

    @Test
    void getBookingById_whenNotFound_throwsEntityNotFoundException() {
        when(bookingRepository.findByIdWithDetails(99L))
                .thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> bookingService.getBookingById(99L));
    }
}