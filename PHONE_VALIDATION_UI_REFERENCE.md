# Phone Number Validation - UI/UX Reference

## Visual States of the Contact Field

### 1. Initial/Untouched State
```
┌─ Preferred Contact *
│ ┌──────────────────────────────────────────┐
│ │ e.g. +94771234567, 0771234567, or 77... │ ← placeholder text
│ └──────────────────────────────────────────┘
│ Format: +94, 10 digits (0XXXXXXXX), or 9 digits (7XXXXXXXX)
└─
```
- Border: Slate gray (#94a3b8)
- Background: White
- Button State: DISABLED (cannot proceed)

---

### 2. User Typing Valid Phone
```
┌─ Preferred Contact *
│ ┌──────────────────────────────────────────┐
│ │ 0771234567                               │ ← green border
│ └──────────────────────────────────────────┘
│ ✓ Valid phone number
│ Format: +94, 10 digits (0XXXXXXXX), or 9 digits (7XXXXXXXX)
└─
```
- Border: Emerald green (#10b981)
- Background: Emerald light (#f0fdf4)
- Text: "Valid phone number" with checkmark
- Button State: ENABLED ✅ (can proceed)

---

### 3. User Typing Invalid Phone
```
┌─ Preferred Contact *
│ ┌──────────────────────────────────────────┐
│ │ 123                                      │ ← red border
│ └──────────────────────────────────────────┘
│ ⚠ Enter a valid phone number (+94771234567,...
│ Format: +94, 10 digits (0XXXXXXXX), or 9 digits (7XXXXXXXX)
└─
```
- Border: Red (#ef4444)
- Background: Red light (#fef2f2)
- Error Icon: Outlined circle with exclamation mark
- Error Text: "Enter a valid phone number (+94771234567, 0771234567, or 771234567)"
- Button State: DISABLED ❌ (cannot proceed)

---

### 4. Field in Focus (Valid)
```
┌─ Preferred Contact *
│ ┌──────────────────────────────────────────┐
│ │ 771234567                                │ ← green border + ring
│ └──────────────────────────────────────────┘
│   ╭─ focus ring (emerald)
│ ✓ Valid phone number
│ Format: +94, 10 digits (0XXXXXXXX), or 9 digits (7XXXXXXXX)
└─
```
- Border: Emerald green with focus ring
- Background: Emerald light
- Focus Ring: Emerald with opacity
- Button State: ENABLED ✅

---

### 5. Field in Focus (Invalid)
```
┌─ Preferred Contact *
│ ┌──────────────────────────────────────────┐
│ │ abc@123                                  │ ← red border + ring
│ └──────────────────────────────────────────┘
│   ╭─ focus ring (red)
│ ⚠ Enter a valid phone number (+94771234567,...
│ Format: +94, 10 digits (0XXXXXXXX), or 9 digits (7XXXXXXXX)
└─
```
- Border: Red with focus ring
- Background: Red light
- Focus Ring: Red with opacity
- Button State: DISABLED ❌

---

## Step 2: Location & Contact Form Layout

```
╔═══════════════════════════════════════════════════════╗
║  Where & how to reach you                            ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  Location *                                          ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │ e.g. Block A, Room 204                          │ ║
║  └─────────────────────────────────────────────────┘ ║
║                                                       ║
║  Preferred Contact *                                 ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │ 0771234567                                      │ ║
║  └─────────────────────────────────────────────────┘ ║
║  ✓ Valid phone number                               ║
║  Format: +94, 10 digits (0XXXXXXXX), or...          ║
║                                                       ║
║  Evidence Images (optional, max 3)                  ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │                                                 │ ║
║  │  📁 Drag files here or click to select         │ ║
║  │     Max 3 files, 5MB each                      │ ║
║  │                                                 │ ║
║  └─────────────────────────────────────────────────┘ ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║  ◄ Back                              Continue ►      ║
╚═══════════════════════════════════════════════════════╝
```

---

## Progress Indicator (Step 2 of 3)

```
  ✓ Issue details        Location & contact       Review & submit
   
  ━━━━━━━━━━━━━━━━━━━━━━━━████████────────────────

  At Step 2:
  - Step 1 shows checkmark (completed)
  - Step 2 shows highlighted circle with current step indicator
  - Step 3 shows number 3 (not yet visited)
```

---

## Form Submission Example

### Valid Submission Sequence:
```
Step 1: Issue Details
├─ Title: "Water leak in bathroom"                    ✓
├─ Description: "There is water dripping from..."    ✓
├─ Category: Plumbing                                ✓
└─ Priority: High                                    ✓
  → ✓ Continue button ENABLED

        ↓ Click Continue

Step 2: Location & Contact
├─ Location: "Block C, Room 404"                     ✓
├─ Phone: "0771234567"                               ✓ (green)
└─ Images: (optional)
  → ✓ Continue button ENABLED

        ↓ Click Continue

Step 3: Review & Submit
├─ Shows all information                             ✓
├─ Everything looks good!                            ✓
└─ ✓ Submit Ticket button ENABLED

        ↓ Click Submit

Backend Validation:
├─ Title: NotBlank ✓
├─ Description: NotBlank ✓
├─ Category: NotNull ✓
├─ Priority: NotNull ✓
├─ Phone: @NotBlank ✓ + @ValidPhoneNumber ✓
└─ All validations pass ✓

        ↓

Success Response:
"Request submitted. An admin will assign a 
technician — open your ticket anytime to 
follow progress and chat."

        ↓ Redirected to /tickets
```

---

## Invalid Submission Example

### Invalid Phone Submission Sequence:
```
Step 2: Location & Contact
├─ Location: "Block C, Room 404"                     ✓
├─ Phone: "123"                                      ✗ (red)
│  Error: "Enter a valid phone number..."
└─ Continue button: DISABLED ❌

        ↓ User cannot proceed
        
        ↓ User fixes phone to "0771234567"
        
├─ Phone: "0771234567"                               ✓ (green)
│  Success: "✓ Valid phone number"
└─ Continue button: ENABLED ✅

        ↓ Now user can proceed
```

---

## Color & Icon Reference

### Success State
- Border Color: `#10b981` (emerald-500)
- Background: `#f0fdf4` (emerald-50)
- Icon: CheckCircle (lucide-react) in green
- Message Color: `#047857` (emerald-700)

### Error State
- Border Color: `#ef4444` (red-500)
- Background: `#fef2f2` (red-50)
- Icon: AlertCircle (lucide-react) in red
- Message Color: `#dc2626` (red-600)

### Focus State
- Ring Color: Matches border (green or red)
- Ring Width: 2px
- Ring Opacity: medium

---

## Accessibility Features

✅ **Type="tel"** - Semantic HTML for phone inputs
✅ **Labels** - Clear, associated labels for screen readers
✅ **Error Messages** - Descriptive, inline error text
✅ **Icons** - Visual indicators with text fallback
✅ **Focus States** - Clear visual feedback on interaction
✅ **Required Fields** - Marked with red asterisk (*)
✅ **Placeholder Text** - Examples provided

---

## Responsive Design

The form maintains the same layout and functionality across all screen sizes:
- Desktop: Full width with spacing
- Tablet: Adjusted spacing, same layout
- Mobile: Single column, full-width inputs

All validation works identically on all devices.
