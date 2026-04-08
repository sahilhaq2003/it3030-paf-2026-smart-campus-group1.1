# Phone Validation - Quick Testing Guide

## How to Test Phone Number Validation

### Frontend Testing (Real-time Validation)

1. **Open the application** at `http://localhost:5174/tickets/create`

2. **Navigate to Step 2** (Location & Contact)

3. **Test Valid Phone Numbers:**
   - Type: `771234567` → Should show ✅ green border + "Valid phone number" message
   - Type: `0771234567` → Should show ✅ green border + "Valid phone number" message
   - Type: `+94771234567` → Should show ✅ green border + "Valid phone number" message
   - Type: `+94071234567` → Should show ✅ green border + "Valid phone number" message

4. **Test Invalid Phone Numbers:**
   - Type: `123456789` → Shows ❌ "Enter a valid phone number"
   - Type: `0771234` (too short) → Shows ❌ error
   - Type: `+9571234567` (wrong country code) → Shows ❌ error
   - Type: `abc` → Shows ❌ error

5. **Test Form Progression:**
   - Leave phone field empty → Continue button is DISABLED
   - Enter invalid phone → Continue button remains DISABLED
   - Enter valid phone → Continue button ENABLED
   - Fill location + valid phone → Can proceed to Step 3

### Backend Testing (API Validation)

1. **Valid Request (should succeed):**
```bash
curl -X POST http://localhost:8080/api/tickets \
  -H "Content-Type: multipart/form-data" \
  -F 'ticket={"title":"Test","description":"Test issue here","category":"ELECTRICAL","priority":"MEDIUM","preferredContact":"0771234567","location":"Block A"};type=application/json'
```

Response: `201 Created` with ticket data

2. **Invalid Phone (should fail):**
```bash
curl -X POST http://localhost:8080/api/tickets \
  -H "Content-Type: multipart/form-data" \
  -F 'ticket={"title":"Test","description":"Test issue here","category":"ELECTRICAL","priority":"MEDIUM","preferredContact":"123456","location":"Block A"};type=application/json'
```

Response: `400 Bad Request` with error:
```json
{
  "message": "Invalid phone number. Use format: +94771234567, 0771234567, or 771234567"
}
```

3. **Missing Phone (should fail):**
```bash
curl -X POST http://localhost:8080/api/tickets \
  -H "Content-Type: multipart/form-data" \
  -F 'ticket={"title":"Test","description":"Test issue here","category":"ELECTRICAL","priority":"MEDIUM","location":"Block A"};type=application/json'
```

Response: `400 Bad Request` with error: "Phone number is required"

### Visual Feedback Reference

| Scenario | Border | Background | Message | Button |
|----------|--------|-----------|---------|--------|
| Empty field | Slate | Slate | (none) | Disabled |
| Typing invalid | Red | Red-50 | ❌ Error message | Disabled |
| Valid phone | Green | Green-50 | ✅ Valid phone number | Enabled |
| Touched, invalid | Red | Red-50 | ❌ Error message | Disabled |

### Format Reference Card

**Valid Formats:**
- 10 digits: `0771234567` (format: 0 + 9 digits)
- 9 digits: `771234567` (format: 7 + 8 digits)
- +94 Country Code variants:
  - `+94771234567` (country + 9-digit format)
  - `+94071234567` (country + 10-digit format)

**Rules:**
- First digit of 10-digit number MUST be `0`
- First digit of 9-digit number MUST be `7`
- Country code is optional
- Spaces are ignored (auto-stripped)

### Example Test Scenarios

#### ✅ Successful Ticket Creation:
1. Title: "Broken Air Conditioner"
2. Description: "The AC in Block B is making strange noises and not cooling"
3. Category: "Electrical"
4. Priority: "High"
5. Location: "Block B, Room 301"
6. Phone: `0771234567` ← Valid!
7. Click Submit → Ticket created successfully!

#### ❌ Blocked Submission:
1. (Complete all fields as above)
2. Phone: `invalid-phone` ← Invalid!
3. Click Continue → Button disabled, cannot proceed
4. (User sees red error message)
5. Fix phone to `0771234567`
6. Click Continue → Now works! ✅

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Error persists after fixing | Field not validated after change | Click outside field (blur event) or retype |
| Can't proceed to Step 3 | Phone validation failing | Check that phone starts with 0 (10 digits) or 7 (9 digits) |
| 400 error on submit | Backend validation failed | Verify frontend validation passed, check API response |
| Space-separated format fails | Spaces not handled | Spaces are automatically stripped; no need to remove |

### Browser DevTools Testing

**Console Test:**
```javascript
// Test validation directly in console
const regex = /^(\+94)?(0\d{9}|7\d{8})$/;
regex.test("0771234567");     // true ✅
regex.test("771234567");      // true ✅
regex.test("+94771234567");   // true ✅
regex.test("invalid");        // false ❌
```

---

## Expected Behavior Summary

✅ **User enters Step 2:** Phone field is empty, Continue button disabled
✅ **User types `0771234567`:** Field turns green, "Valid phone number" shows, Continue button enabled
✅ **User tries `12345`:** Field turns red, error message appears, Continue button stays disabled
✅ **User enters `+94771234567`:** Field turns green, Continue button enabled
✅ **User clicks Continue:** Proceeds to Step 3 Review
✅ **User clicks Submit:** Backend validates again, creates ticket if valid, shows error if invalid
