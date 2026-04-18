package com.smartcampus.booking.service;

import com.smartcampus.booking.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConflictCheckServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private ConflictCheckService conflictCheckService;

    private final Long FACILITY_ID = 1L;
    private final LocalDate DATE = LocalDate.of(2026, 5, 1);
    private final LocalTime START = LocalTime.of(9, 0);
    private final LocalTime END = LocalTime.of(11, 0);

    @Test
    void hasConflict_whenConflictExists_returnsTrue() {
        when(bookingRepository.existsConflict(FACILITY_ID, DATE, START, END, null))
                .thenReturn(true);

        boolean result = conflictCheckService.hasConflict(FACILITY_ID, DATE, START, END);

        assertTrue(result);
        verify(bookingRepository).existsConflict(FACILITY_ID, DATE, START, END, null);
    }

    @Test
    void hasConflict_whenNoConflict_returnsFalse() {
        when(bookingRepository.existsConflict(FACILITY_ID, DATE, START, END, null))
                .thenReturn(false);

        boolean result = conflictCheckService.hasConflict(FACILITY_ID, DATE, START, END);

        assertFalse(result);
    }

    @Test
    void hasConflictExcluding_whenNoOtherConflicts_returnsFalse() {
        when(bookingRepository.findConflicts(FACILITY_ID, DATE, START, END, 5L))
                .thenReturn(java.util.List.of());

        boolean result = conflictCheckService.hasConflictExcluding(
                FACILITY_ID, DATE, START, END, 5L);

        assertFalse(result);
    }

    @Test
    void hasConflictExcluding_whenOtherConflictExists_returnsTrue() {
        com.smartcampus.booking.model.Booking other =
                new com.smartcampus.booking.model.Booking();
        other.setId(99L);

        when(bookingRepository.findConflicts(FACILITY_ID, DATE, START, END, 5L))
                .thenReturn(java.util.List.of(other));

        boolean result = conflictCheckService.hasConflictExcluding(
                FACILITY_ID, DATE, START, END, 5L);

        assertTrue(result);
    }

    @Test
    void hasConflict_withDifferentFacility_returnsFalse() {
        when(bookingRepository.existsConflict(2L, DATE, START, END, null))
                .thenReturn(false);

        boolean result = conflictCheckService.hasConflict(2L, DATE, START, END);

        assertFalse(result);
    }

    @Test
    void hasConflict_withDifferentDate_returnsFalse() {
        LocalDate differentDate = LocalDate.of(2026, 6, 1);
        when(bookingRepository.existsConflict(FACILITY_ID, differentDate, START, END, null))
                .thenReturn(false);

        boolean result = conflictCheckService.hasConflict(
                FACILITY_ID, differentDate, START, END);

        assertFalse(result);
    }

    @Test
    void hasConflict_withNonOverlappingTime_returnsFalse() {
        LocalTime laterStart = LocalTime.of(12, 0);
        LocalTime laterEnd = LocalTime.of(14, 0);
        when(bookingRepository.existsConflict(FACILITY_ID, DATE, laterStart, laterEnd, null))
                .thenReturn(false);

        boolean result = conflictCheckService.hasConflict(
                FACILITY_ID, DATE, laterStart, laterEnd);

        assertFalse(result);
    }

    @Test
    void hasConflictExcluding_excludesSameBookingId() {
        Long excludeId = 10L;
        when(bookingRepository.findConflicts(FACILITY_ID, DATE, START, END, excludeId))
                .thenReturn(java.util.List.of());

        boolean result = conflictCheckService.hasConflictExcluding(
                FACILITY_ID, DATE, START, END, excludeId);

        assertFalse(result);
        verify(bookingRepository).findConflicts(FACILITY_ID, DATE, START, END, excludeId);
    }
}