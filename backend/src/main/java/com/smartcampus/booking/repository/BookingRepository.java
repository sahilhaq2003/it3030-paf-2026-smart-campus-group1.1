package com.smartcampus.booking.repository;

import com.smartcampus.booking.model.Booking;
import com.smartcampus.booking.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Eagerly fetch user, facility, and reviewedBy in one query to avoid LazyInitializationException
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.facility LEFT JOIN FETCH b.reviewedBy WHERE b.id = :id")
    Optional<Booking> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.facility LEFT JOIN FETCH b.reviewedBy ORDER BY b.createdAt DESC")
    List<Booking> findAllWithDetails();

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.facility LEFT JOIN FETCH b.reviewedBy WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    List<Booking> findByUserIdWithDetails(@Param("userId") Long userId);

    // Get all bookings for a specific user
    List<Booking> findByUserId(Long userId);

    // Get all bookings for a specific facility
    List<Booking> findByFacilityId(Long facilityId);

    // Get bookings by status
    List<Booking> findByStatus(BookingStatus status);

    // Conflict check — does this facility already have an approved/pending
    // booking that overlaps with the requested time slot?
    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.facility.id = :facilityId
        AND b.bookingDate = :date
        AND b.status IN ('PENDING', 'APPROVED')
        AND b.startTime < :endTime
        AND b.endTime > :startTime
    """)
    boolean existsConflict(
        @Param("facilityId") Long facilityId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );

    // Get all conflicting bookings (used in availability checker)
    @Query("""
        SELECT b FROM Booking b
        WHERE b.facility.id = :facilityId
        AND b.bookingDate = :date
        AND b.status IN ('PENDING', 'APPROVED')
        AND b.startTime < :endTime
        AND b.endTime > :startTime
    """)
    List<Booking> findConflicts(
        @Param("facilityId") Long facilityId,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );
}