package com.smartcampus.facilities.booking.repository;

import com.smartcampus.facilities.booking.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    /**
     * Overlap check:
     * existing.startAt < requested.endAt AND existing.endAt > requested.startAt
     */
    boolean existsByFacility_IdAndStartAtBeforeAndEndAtAfter(
            Long facilityId, LocalDateTime requestedEnd, LocalDateTime requestedStart);
}

