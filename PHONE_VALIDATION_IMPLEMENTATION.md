# Phone Number Validation Implementation

## Overview
Comprehensive phone number validation has been implemented for the ticket creation form at `/tickets/create`, with both frontend (real-time) and backend (server-side) validation.

## Validation Rules

### Format Requirements
The phone number field accepts the following formats only:

1. **9 digits starting with 7** (without country code)
   - Example: `771234567`
   - Pattern: `7` followed by 8 more digits

2. **10 digits starting with 0** (without country code)
   - Example: `0771234567`
   - Pattern: `0` followed by 9 more digits

3. **Country code +94 with 9 digits starting with 7**
   - Example: `+94771234567`
   - Pattern: `+94` followed by `7` and 8 more digits

4. **Country code +94 with 10 digits starting with 0**
   - Example: `+94071234567`
   - Pattern: `+94` followed by `0` and 9 more digits

### Invalid Formats (Examples)
These will be rejected:
- `0771234` (too short)
- `771234` (too short)
- `0771234567890` (too long)
- `1771234567` (wrong first digit for 10-digit format)
- `8771234567` (wrong first digit for 9-digit format)
- `+9571234567` (wrong country code)
- `abcdefghij` (non-numeric)

---

## Frontend Implementation

### File: `frontend/src/pages/member3/CreateTicketPage.jsx`

#### Changes Made:
1. **Phone Validation Function** (added in validation section)
   - Real-time validation against regex pattern: `^(\+94)?(0\d{9}|7\d{8})$`
   - Validates on both `onChange` and `onBlur` events
   - Provides immediate user feedback

2. **Contact Field Updates** (Step 2: Location & Contact)
   - Changed `type="text"` to `type="tel"` for semantic HTML
   - Added red border and background when validation fails
   - Added green border and background when phone is valid
   - Shows error message with AlertCircle icon when invalid
   - Shows success message with CheckCircle icon when valid
   - Displays format hint below the field

3. **Validation Rules Integration**
   - Added `validatePhoneNumber()` function to main validate method
   - Updated `canProceedStep2` check to include `!errors.contact`
   - Prevents form progression if phone is invalid

#### Features:
- ✅ Real-time validation as user types
- ✅ Visual feedback: red background for errors, green for success
- ✅ Clear inline error messages
- ✅ Format hints and examples
- ✅ Only allows progression to next step when valid

### File: `frontend/src/utils/phoneValidation.js` (optional utility)
Helper functions for phone validation:
- `isValidPhoneNumber(phone)` - Returns boolean
- `getPhoneValidationError(phone)` - Returns error message or null
- Test data arrays with valid/invalid examples

---

## Backend Implementation

### File: `backend/src/main/java/com/smartcampus/maintenance/validator/ValidPhoneNumber.java`

Custom validation annotation that:
- Marks the `preferredContact` field as validated
- Provides descriptive error messages
- Works with Jakarta Validation (Bean Validation)

### File: `backend/src/main/java/com/smartcampus/maintenance/validator/PhoneNumberValidator.java`

Validator implementation that:
- Implements `ConstraintValidator<ValidPhoneNumber, String>`
- Uses same regex pattern as frontend: `^(\+94)?(0\d{9}|7\d{8})$`
- Strips whitespace before validation
- Provides detailed error messages
- Allows null values (use `@NotNull` or `@NotBlank` for mandatory)

### File: `backend/src/main/java/com/smartcampus/maintenance/dto/TicketRequestDTO.java`

Updated field annotations:
```java
@NotBlank(message = "Phone number is required")
@ValidPhoneNumber(message = "Invalid phone number. Use format: +94771234567, 0771234567, or 771234567")
private String preferredContact;
```

#### Features:
- ✅ Server-side validation prevents invalid data submission
- ✅ Consistent validation rules between frontend and backend
- ✅ Clear error messages returned to API clients
- ✅ Protects against client-side bypass attempts

---

## Validation Flow

### User Journey:

1. **User enters ticket details (Step 1)**
   - No phone validation yet

2. **User moves to Step 2: Location & Contact**
   - Phone field appears

3. **User types phone number**
   - Validation runs in real-time as they type
   - If invalid: red border + error message
   - If valid: green border + success message

4. **User leaves the field (onBlur)**
   - Validation re-runs to ensure value is final

5. **User clicks "Continue" button**
   - `canProceedStep2` checks if phone is valid
   - Button is disabled if phone is invalid
   - Form can only proceed with valid phone

6. **User clicks "Submit"**
   - Frontend sends validated data to backend
   - Backend re-validates using `@ValidPhoneNumber`
   - If invalid: 400 Bad Request with validation error
   - If valid: Ticket created successfully

---

## Testing

### Valid Test Cases:
- `771234567` ✅
- `0771234567` ✅
- `+94771234567` ✅
- `+94071234567` ✅
- `+94 77 1234 567` ✅ (spaces are stripped)

### Invalid Test Cases:
- Empty field - Shows "Phone number is required"
- `123456789` - Shows validation error
- `abc` - Shows validation error
- `0771234` (too short) - Shows validation error
- `77123456700` (too long) - Shows validation error
- `+95771234567` (wrong country code) - Shows validation error

---

## Error Messages

### Frontend Error:
```
Enter a valid phone number (+94771234567, 0771234567, or 771234567)
```

### Backend Error:
```
Invalid phone number. Use format: +94771234567, 0771234567, or 771234567 
(10 digits starting with 0, or 9 digits starting with 7)
```

---

## Security Considerations

1. **Frontend Validation**: User feedback and UX improvement
2. **Backend Validation**: Prevents invalid data from being stored
3. **Regex Pattern**: Must match exact rules (no bypass possible)
4. **API Response**: Validation errors clearly indicate what went wrong

---

## Files Modified/Created

### Created:
- `backend/src/main/java/com/smartcampus/maintenance/validator/ValidPhoneNumber.java`
- `backend/src/main/java/com/smartcampus/maintenance/validator/PhoneNumberValidator.java`
- `frontend/src/utils/phoneValidation.js`

### Modified:
- `frontend/src/pages/member3/CreateTicketPage.jsx`
- `backend/src/main/java/com/smartcampus/maintenance/dto/TicketRequestDTO.java`

---

## Build & Deployment

Both frontend and backend have been verified to compile without errors:
- ✅ Backend: `mvn compile` - SUCCESS
- ✅ Frontend: `npm run build` - SUCCESS

---

## Future Enhancements (Optional)

1. Support for international phone numbers beyond Sri Lanka (+94)
2. SMS verification of phone number (if needed)
3. Allow user to choose between phone and email
4. Phone number formatting helpers (auto-add +94, etc.)
5. Rate limiting on phone validation API calls
