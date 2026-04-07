/**
 * Phone Number Validation Utility
 * 
 * Validates phone numbers in the following formats:
 * - 10 digits starting with 0: 0771234567
 * - 9 digits starting with 7: 771234567
 * - With country code (+94): +94771234567 or +94071234567
 * 
 * Rules:
 * - If 10 digits: first digit MUST be 0
 * - If 9 digits: first digit MUST be 7
 * - Optional +94 country code prefix
 */

export const PHONE_REGEX = /^(\+94)?(0\d{9}|7\d{8})$/;

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  const cleanedPhone = phone.replace(/\s/g, '');
  return PHONE_REGEX.test(cleanedPhone);
};

/**
 * Get phone validation error message
 * @param {string} phone - Phone number to validate
 * @returns {string|null} - Error message or null if valid
 */
export const getPhoneValidationError = (phone) => {
  if (!phone) {
    return 'Phone number is required';
  }
  if (!isValidPhoneNumber(phone)) {
    return 'Enter a valid phone number (+94771234567, 0771234567, or 771234567)';
  }
  return null;
};

// Valid phone number examples for testing:
export const VALID_PHONE_EXAMPLES = [
  '0771234567',      // 10 digits starting with 0
  '771234567',       // 9 digits starting with 7
  '+94771234567',    // Country code with 9 digits
  '+94071234567',    // Country code with 10 digits
  '+94 77 1234 567', // With spaces (spaces are stripped)
];

// Invalid phone number examples for testing:
export const INVALID_PHONE_EXAMPLES = [
  '0771234',         // Too short
  '771234',          // Too short
  '0771234567890',   // Too long
  '1771234567',      // Incorrect first digit (10 digits must start with 0)
  '8771234567',      // Incorrect first digit (9 digits must start with 7)
  '+9571234567',     // Wrong country code
  'abcdefghij',      // Non-numeric
];
