package com.smartcampus.maintenance.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Validates phone numbers:
 
 */
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PhoneNumberValidator.class)
@Documented
public @interface ValidPhoneNumber {
    String message() default "Invalid phone number format. Use +94771234567, 0771234567, or 771234567";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
