package com.smartcampus.maintenance.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Validates phone numbers with the following format rules:
 * - Optional +94 country code (or +)
 * - 10 digits starting with 0 (e.g., 0771234567)
 * - OR 9 digits starting with 7 (e.g., 771234567)
 * - OR +94 followed by 9 digits starting with 7 (e.g., +94771234567)
 * - OR +94 followed by 10 digits starting with 0 (e.g., +94071234567)
 *
 * Examples of valid phone numbers:
 * - 0771234567
 * - 771234567
 * - +94771234567
 * - +94071234567
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
