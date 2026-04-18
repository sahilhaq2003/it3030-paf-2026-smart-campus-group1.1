package com.smartcampus.facilities.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Custom exception thrown when attempting to delete a facility
 * that still has active bookings associated with it. 
 * Triggers an HTTP 409 Conflict response.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class ActiveBookingsExistException extends RuntimeException {
    public ActiveBookingsExistException(String message) {
        super(message);
    }
}
