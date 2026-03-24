package com.smartcampus.facilities.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class ActiveBookingsExistException extends RuntimeException {
    public ActiveBookingsExistException(String message) {
        super(message);
    }
}
