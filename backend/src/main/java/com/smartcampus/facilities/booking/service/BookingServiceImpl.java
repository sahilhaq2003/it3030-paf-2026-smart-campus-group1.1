package com.smartcampus.facilities.booking.service;

import com.smartcampus.facilities.booking.dto.BookingRequestDTO;
import com.smartcampus.facilities.booking.dto.BookingResponseDTO;
import com.smartcampus.facilities.booking.model.Booking;
import com.smartcampus.facilities.booking.model.BookingStatus;
import com.smartcampus.facilities.booking.repository.BookingRepository;
import com.smartcampus.facilities.model.Facility;
import com.smartcampus.facilities.repository.FacilityRepository;
import com.smartcampus.notification.model.NotificationType;
import com.smartcampus.notification.model.ReferenceType;
import com.smartcampus.notification.service.NotificationService;
import com.smartcampus.user.model.User;
import com.smartcampus.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    public BookingResponseDTO createBooking(BookingRequestDTO request, Long userId) {
        Facility facility =
                facilityRepository
                        .findById(request.facilityId())
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Facility not found"));

        if (request.endAt() == null
                || request.startAt() == null
                || !request.endAt().isAfter(request.startAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endAt must be after startAt");
        }

        boolean conflict =
                bookingRepository.existsByFacility_IdAndStartAtBeforeAndEndAtAfter(
                        facility.getId(), request.endAt(), request.startAt());

        if (conflict) {
            // Notify even when rejecting; no surrounding transaction here, so notification persists.
            String title = "Booking rejected";
            String message =
                    String.format(
                            "Facility %s is already booked for the selected time range",
                            facility.getName());
            notificationService.createNotification(
                    userId,
                    NotificationType.BOOKING_REJECTED,
                    title,
                    message,
                    facility.getId(),
                    ReferenceType.BOOKING);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Facility already booked for the selected time range");
        }

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "User not found"));

        Booking saved =
                bookingRepository.save(
                        Booking.builder()
                                .facility(facility)
                                .bookedBy(user)
                                .startAt(request.startAt())
                                .endAt(request.endAt())
                                .status(BookingStatus.APPROVED)
                                .build());

        String title = "Booking approved";
        String message =
                String.format(
                        "Your booking for facility %s is confirmed", facility.getName());

        notificationService.createNotification(
                userId,
                NotificationType.BOOKING_APPROVED,
                title,
                message,
                saved.getId(),
                ReferenceType.BOOKING);

        return new BookingResponseDTO(
                saved.getId(),
                facility.getId(),
                user.getId(),
                saved.getStartAt(),
                saved.getEndAt(),
                saved.getStatus(),
                saved.getCreatedAt());
    }
}

