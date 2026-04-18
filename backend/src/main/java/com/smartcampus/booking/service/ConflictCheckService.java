package com.smartcampus.booking.service;

import com.smartcampus.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class ConflictCheckService {

    private final BookingRepository bookingRepository;

    /**
     * Returns true if there is a conflicting booking
     * for the same facility, date and overlapping time range.
     */
    public boolean hasConflict(Long facilityId, LocalDate date,
                                LocalTime startTime, LocalTime endTime) {
        return bookingRepository.existsConflict(
                facilityId, date, startTime, endTime, null);
    }

    /**
     * Returns true if there is a conflict excluding a specific booking
     * (used when approving — to ignore the booking being approved itself)
     */
    public boolean hasConflictExcluding(Long facilityId, LocalDate date,
                                         LocalTime startTime, LocalTime endTime,
                                         Long excludeBookingId) {
        return bookingRepository.findConflicts(
                facilityId, date, startTime, endTime, excludeBookingId)
                .stream()
                .anyMatch(b -> !b.getId().equals(excludeBookingId));
    }
}