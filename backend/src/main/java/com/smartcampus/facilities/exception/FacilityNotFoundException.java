package com.smartcampus.facilities.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Custom exception thrown when a requested facility cannot be found
 * in the system. Triggers an HTTP 404 Not Found response.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class FacilityNotFoundException extends RuntimeException {
    public FacilityNotFoundException(String message) {
        super(message);
    }
}
