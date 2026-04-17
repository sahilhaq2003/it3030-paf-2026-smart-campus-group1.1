package com.smartcampus.booking.service;

public interface BookingQrEmailService {
    void sendQrEmail(Long bookingId, String recipientEmail, String recipientName,
                     String facilityName, String bookingDate,
                     String startTime, String endTime);
}