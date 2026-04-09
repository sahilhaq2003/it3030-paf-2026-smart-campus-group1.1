package com.smartcampus.maintenance.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

/**
 * Validates phone numbers according to the following rules:
 * - Optional +94 country code followed by:
 *   - 10 digits starting with 0 (e.g., 0771234567)
 *   - OR 9 digits starting with 7 (e.g., 771234567)
 * - OR 10 digits starting with 0 without country code
 * - OR 9 digits starting with 7 without country code
 */
public class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {
    
    // Pattern: optional +94, then either (0 + 9 digits) or (7 + 8 digits)
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+94)?(0\\d{9}|7\\d{8})$");

    @Override
    public void initialize(ValidPhoneNumber constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Allow null values - use @NotNull for mandatory validation
        if (value == null) {
            return true;
        }

        // Remove whitespace for validation (but pattern expects specific format)
        String cleanedPhone = value.replaceAll("\\s", "");

        // Validate against phone pattern
        boolean isValid = PHONE_PATTERN.matcher(cleanedPhone).matches();

        if (!isValid) {
            // Add helpful context to the error message
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                    "Invalid phone number. Use format: +94771234567, 0771234567, or 771234567 " +
                    "(10 digits starting with 0, or 9 digits starting with 7)"
            ).addConstraintViolation();
        }

        return isValid;
    }
}
