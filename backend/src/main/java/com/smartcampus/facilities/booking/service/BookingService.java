package com.smartcampus.facilities.booking.service;

import com.smartcampus.facilities.booking.dto.BookingRequestDTO;
import com.smartcampus.facilities.booking.dto.BookingResponseDTO;

public interface BookingService {

    BookingResponseDTO createBooking(BookingRequestDTO request, Long userId);
}

