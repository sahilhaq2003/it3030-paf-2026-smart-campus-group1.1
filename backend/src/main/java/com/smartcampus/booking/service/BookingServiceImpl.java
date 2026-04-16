package com.smartcampus.booking.service;

import com.smartcampus.booking.dto.BookingRequestDTO;
import com.smartcampus.booking.dto.BookingResponseDTO;
import com.smartcampus.booking.dto.BookingReviewDTO;
import com.smartcampus.booking.event.BookingStatusChangedEvent;
import com.smartcampus.booking.model.Booking;
import com.smartcampus.booking.model.BookingStatus;
import com.smartcampus.booking.repository.BookingRepository;
import com.smartcampus.facilities.model.Facility;
import com.smartcampus.user.model.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ─── Create ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO request, Long userId) {

        // Conflict check
        boolean conflict = bookingRepository.existsConflict(
                request.getFacilityId(),
                request.getBookingDate(),
                request.getStartTime(),
                request.getEndTime()
        );
        if (conflict) {
            throw new IllegalStateException(
                "This facility is already booked for the selected date and time.");
        }

        // Build references (JPA proxy — no extra DB call)
        User user = new User();
        user.setId(userId);

        Facility facility = new Facility();
        facility.setId(request.getFacilityId());

        Booking booking = Booking.builder()
        .user(user)
        .facility(facility)
        .bookingDate(request.getBookingDate())
        .startTime(request.getStartTime())
        .endTime(request.getEndTime())
        .purpose(request.getPurpose())
        .expectedAttendees(request.getExpectedAttendees()) // ADD THIS
        .status(BookingStatus.PENDING)
        .build();
        Booking saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    @Override
    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAll()
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponseDTO> getMyBookings(Long userId) {
        return bookingRepository.findByUserId(userId)
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponseDTO getBookingById(Long bookingId) {
        Booking booking = findOrThrow(bookingId);
        return mapToResponse(booking);
    }

    @Override
    public boolean isAvailable(Long facilityId, LocalDate date,
                                LocalTime startTime, LocalTime endTime) {
        return !bookingRepository.existsConflict(facilityId, date, startTime, endTime);
    }
        @Override
    @Transactional
    public BookingResponseDTO updateBooking(Long bookingId, BookingRequestDTO request, Long userId) {
        Booking booking = findOrThrow(bookingId);

        // Security check: Only the person who created the booking can edit it
        if (!booking.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You do not have permission to update this booking.");
        }

        // Only check for a schedule conflict if the user actually changed the date or time limits
        if (!booking.getBookingDate().equals(request.getBookingDate()) ||
            !booking.getStartTime().equals(request.getStartTime()) ||
            !booking.getEndTime().equals(request.getEndTime())) {
            
            boolean conflict = bookingRepository.existsConflict(
                    request.getFacilityId(),
                    request.getBookingDate(),
                    request.getStartTime(),
                    request.getEndTime()
            );
            
            if (conflict) {
                throw new IllegalStateException("This facility is already booked for the selected date and time.");
            }
        }

        // Apply all the new edits to the database entity
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setExpectedAttendees(request.getExpectedAttendees());

        // Save it to the database
        Booking saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }


    // ─── Admin Actions ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BookingResponseDTO approveBooking(Long bookingId, Long adminId) {
        Booking booking = findOrThrow(bookingId);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be approved.");
        }

        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(BookingStatus.APPROVED);
        Booking saved = bookingRepository.save(booking);

        // Fire event for Member 4's notification listener
        eventPublisher.publishEvent(new BookingStatusChangedEvent(
                this,
                saved.getId(),
                saved.getUser().getId(),
                oldStatus,
                BookingStatus.APPROVED,
                saved.getFacility().getName(),
                "Your booking has been approved!"
        ));

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponseDTO rejectBooking(Long bookingId,
                                            BookingReviewDTO review,
                                            Long adminId) {
        Booking booking = findOrThrow(bookingId);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be rejected.");
        }

        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(review.getRejectionReason());
        Booking saved = bookingRepository.save(booking);

        eventPublisher.publishEvent(new BookingStatusChangedEvent(
                this,
                saved.getId(),
                saved.getUser().getId(),
                oldStatus,
                BookingStatus.REJECTED,
                saved.getFacility().getName(),
                "Your booking has been rejected. Reason: " + review.getRejectionReason()
        ));

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponseDTO cancelBooking(Long bookingId, Long userId) {
        Booking booking = findOrThrow(bookingId);

        if (booking.getStatus() == BookingStatus.REJECTED ||
            booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("This booking cannot be cancelled.");
        }

        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        eventPublisher.publishEvent(new BookingStatusChangedEvent(
                this,
                saved.getId(),
                saved.getUser().getId(),
                oldStatus,
                BookingStatus.CANCELLED,
                saved.getFacility().getName(),
                "Your booking has been cancelled."
        ));

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteBooking(Long bookingId) {
        Booking booking = findOrThrow(bookingId);
        bookingRepository.delete(booking);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Booking findOrThrow(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Booking not found with id: " + bookingId));
    }

    private BookingResponseDTO mapToResponse(Booking booking) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId(booking.getId());
        dto.setUserId(booking.getUser().getId());
        dto.setUserName(booking.getUser().getName());
        dto.setFacilityId(booking.getFacility().getId());
        dto.setFacilityName(booking.getFacility().getName());
        dto.setBookingDate(booking.getBookingDate());
        dto.setStartTime(booking.getStartTime());
        dto.setEndTime(booking.getEndTime());
        dto.setStatus(booking.getStatus());
        dto.setPurpose(booking.getPurpose());
        dto.setRejectionReason(booking.getRejectionReason());
        dto.setExpectedAttendees(booking.getExpectedAttendees()); 
        if (booking.getReviewedBy() != null) {                   
            dto.setReviewedById(booking.getReviewedBy().getId()); 
            dto.setReviewedByName(booking.getReviewedBy().getName()); 
        }  
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setUpdatedAt(booking.getUpdatedAt());
        return dto;
    }

    @Override
public Map<String, Object> getAnalytics() {
    List<Booking> all = bookingRepository.findAll();

    long total = all.size();
    long approved = all.stream().filter(b -> b.getStatus() == BookingStatus.APPROVED).count();
    long rejected = all.stream().filter(b -> b.getStatus() == BookingStatus.REJECTED).count();
    long pending = all.stream().filter(b -> b.getStatus() == BookingStatus.PENDING).count();
    long cancelled = all.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count();

    double approvalRate = total > 0 ? (approved * 100.0 / total) : 0;

    // Most booked facilities
    Map<String, Long> facilityCount = all.stream()
        .collect(Collectors.groupingBy(
            b -> b.getFacility().getName(),
            Collectors.counting()
        ));

        // Bookings per day (grouped by when the request was made)
    Map<String, Long> bookingsPerDay = all.stream()
        .filter(b -> b.getCreatedAt() != null)
        .collect(Collectors.groupingBy(
            b -> b.getCreatedAt().toLocalDate().toString(),
            Collectors.counting()
        ));


            // Peak booking hours
    Map<String, Long> peakHours = all.stream()
        .filter(b -> b.getStartTime() != null)
        .collect(Collectors.groupingBy(
            b -> String.format("%02d:00", b.getStartTime().getHour()),
            Collectors.counting()
        ));


    Map<String, Object> analytics = new HashMap<>();
    analytics.put("total", total);
    analytics.put("approved", approved);
    analytics.put("rejected", rejected);
    analytics.put("pending", pending);
    analytics.put("cancelled", cancelled);
    analytics.put("approvalRate", Math.round(approvalRate * 10.0) / 10.0);
    analytics.put("facilityCount", facilityCount);
    analytics.put("bookingsPerDay", bookingsPerDay);
    analytics.put("peakHours", peakHours);


    return analytics;
}
}