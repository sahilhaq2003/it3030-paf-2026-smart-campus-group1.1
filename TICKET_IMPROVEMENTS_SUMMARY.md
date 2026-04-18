# Ticket System Improvements - Implementation Summary

## Date: April 18, 2026

---

## Overview
Comprehensive improvements to the ticket system with better error handling, validation, search capabilities, and HTTP status codes.

---

## 1. Better Error Messages When Ticket Not Found ✅

### Implementation: Enhanced `findTicketOrThrow()` method

**Old Message:**
```
Ticket with ID {id} not found. It may have been deleted or does not exist.
```

**New Message:**
```
Ticket #{id} not found. The ticket may have been deleted or does not exist in the system. 
Please check the ticket ID and try again.
```

### Features:
- More user-friendly and specific
- Includes ticket ID in the message for clarity
- Suggests possible resolution steps
- Validates ID is positive before searching (400 error if invalid)

**Code Location:** `TicketServiceImpl.java` - `findTicketOrThrow()` method

---

## 2. Validation — Title/Description Cannot Be Empty ✅

### Implementation: Enhanced `TicketRequestDTO` with `@NotBlank` and `@Size` annotations

### Validation Rules:
```java
@NotBlank(message = "Title is required and cannot be empty")
@Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
private String title;

@NotBlank(message = "Description is required and cannot be empty")
@Size(min = 10, max = 5000, message = "Description must be between 10 and 5000 characters")
private String description;
```

### Validation Errors (400 Bad Request):
- Empty title: `"Title is required and cannot be empty"`
- Title length issue: `"Title must be between 3 and 200 characters"`
- Empty description: `"Description is required and cannot be empty"`
- Description length issue: `"Description must be between 10 and 5000 characters"`

### Benefits:
- Prevents creation of tickets with empty titles/descriptions
- Enforces reasonable length constraints
- User-friendly validation messages
- Server-side validation on all endpoints

**Code Location:** `TicketRequestDTO.java` - DTO class

---

## 3. @NotNull Annotations on Ticket Request DTO ✅

### Current Annotations:

```java
@NotBlank(message = "Title is required and cannot be empty")
private String title;

@NotBlank(message = "Description is required and cannot be empty")
private String description;

@NotNull(message = "Category is required")
private TicketCategory category;

@NotNull(message = "Priority is required")
private Priority priority;

@NotBlank(message = "Phone number is required")
@ValidPhoneNumber(message = "Invalid phone number...")
private String preferredContact;
```

### Fields Protected:
- ✅ title - @NotBlank (not null, not empty, not whitespace)
- ✅ description - @NotBlank (not null, not empty, not whitespace)
- ✅ category - @NotNull (cannot be null)
- ✅ priority - @NotNull (cannot be null)
- ✅ preferredContact - @NotBlank + @ValidPhoneNumber

### Optional Fields (correctly nullable):
- location - Optional
- facilityId - Optional

---

## 4. Improved HTTP Status Codes ✅

### Status Code Mapping:

| Scenario | HTTP Code | Message |
|----------|-----------|---------|
| Ticket not found | **404 NOT_FOUND** | `Ticket #{id} not found...` |
| Invalid ticket ID (≤0) | **400 BAD_REQUEST** | `Invalid ticket ID...` |
| Invalid status transition | **400 BAD_REQUEST** | `Cannot transition from X to Y...` |
| Access denied (permission) | **403 FORBIDDEN** | `Access denied. Only...` |
| Cannot close non-resolved | **409 CONFLICT** | `Cannot close ticket. Only tickets with RESOLVED status...` |
| Cannot delete resolved/closed | **409 CONFLICT** | `Cannot delete a ticket that has been resolved or closed...` |
| Resolution notes required | **400 BAD_REQUEST** | `Resolution notes are required...` |
| Empty search keyword | **400 BAD_REQUEST** | `Search keyword cannot be empty...` |

### Previous Issues Fixed:
- ✅ 404 (NOT_FOUND) for missing tickets instead of generic errors
- ✅ 400 (BAD_REQUEST) for validation errors (empty search, invalid IDs)
- ✅ 409 (CONFLICT) for incompatible state transitions
- ✅ 403 (FORBIDDEN) for permission issues
- ✅ Prevents 500 errors on common error scenarios

**Code Locations:**
- `TicketServiceImpl.java` - Error handling in all methods
- `TicketController.java` - @PreAuthorize for access control

---

## 5. Add Pagination to Get All Tickets Endpoint ✅

### Current Implementation:

**Endpoint:** `GET /api/tickets`  
**Method:** `getAllTickets(status, category, priority, assignedToId, pageable)`

### Query Parameters:
```
GET /api/tickets?page=0&size=20&sort=createdAt,desc
  &status=OPEN
  &category=ELECTRICAL
  &priority=HIGH
  &assignedToId=5
```

### Features:
- **Page Size:** Configurable (default 20)
- **Page Number:** 0-indexed (page=0 is first page)
- **Sorting:** Multiple fields supported (e.g., `createdAt,desc` or `priority,asc`)
- **Filtering:** By status, category, priority, assignedToId
- **Response:** Always returns `Page<TicketResponseDTO>` with pagination metadata

### Response Format:
```json
{
  "content": [ /* array of tickets */ ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": { "sorted": true, "direction": "DESC" },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "totalPages": 5,
  "totalElements": 97,
  "last": false,
  "first": true,
  "numberOfElements": 20,
  "size": 20,
  "number": 0,
  "empty": false
}
```

### Example Requests:
```bash
# Get first page of all tickets (staff only)
GET /api/tickets?page=0&size=50

# Get resolved tickets for specific technician
GET /api/tickets?page=0&size=20&status=RESOLVED&assignedToId=3

# Get HIGH priority open tickets, sorted by created date
GET /api/tickets?page=0&size=20&priority=HIGH&status=OPEN&sort=createdAt,desc

# Get technician's assigned tickets
GET /api/tickets?assignedToId=5&page=0&size=20
```

**Code Location:** `TicketController.java` - `getAllTickets()` method

---

## 6. Add Ticket Search by Keyword ✅

### New Endpoint: `GET /api/tickets/search`

### Features:
- Full-text search in title and description
- Case-insensitive matching
- Accessible to all authenticated users
- Supports pagination
- Results sorted by creation date (newest first)

### Query Parameters:
```
GET /api/tickets/search?keyword=AC&page=0&size=20&sort=createdAt,desc
```

### Validation:
- Keyword cannot be empty: `"Search keyword cannot be empty..."`
- Minimum 2 characters: `"Search keyword must be at least 2 characters long."`
- Maximum 100 characters: `"Search keyword cannot exceed 100 characters."`

### Error Handling:
```
GET /api/tickets/search?keyword=  
→ 400 Bad Request: "Search keyword cannot be empty. Please provide a search term to find tickets."

GET /api/tickets/search?keyword=a
→ 400 Bad Request: "Search keyword must be at least 2 characters long."

GET /api/tickets/search?keyword={101+ chars}
→ 400 Bad Request: "Search keyword cannot exceed 100 characters."
```

### Example Requests:
```bash
# Search for "AC" in all tickets
curl "http://localhost:8080/api/tickets/search?keyword=AC&page=0&size=20"

# Search for "Door" with pagination
curl "http://localhost:8080/api/tickets/search?keyword=Door&page=1&size=10"

# Search sorted by date (newest)
curl "http://localhost:8080/api/tickets/search?keyword=Repair&sort=createdAt,desc"
```

### Response Example:
```json
{
  "content": [
    {
      "id": 42,
      "title": "AC Unit Not Cooling",
      "description": "AC unit in Lab 3 is not cooling properly...",
      "createdAt": "2024-04-18T10:30:00",
      "updatedAt": "2024-04-18T14:15:00"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "currentPage": 0
}
```

### SQL Query:
```sql
SELECT t FROM Ticket t
WHERE LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
   OR LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
ORDER BY t.createdAt DESC
```

**Code Locations:**
- `TicketController.java` - `searchTickets()` endpoint
- `TicketService.java` - `searchTickets()` interface method
- `TicketServiceImpl.java` - Search implementation with validation
- `TicketRepository.java` - `searchByKeyword()` query method

---

## 7. Improve Ticket Response DTO ✅

### Current DTO Fields:

#### Core Ticket Information:
- `id` - Ticket ID
- `title` - Ticket title
- `description` - Ticket description
- `category` - Ticket category
- `priority` - Ticket priority
- `location` - Location
- `facilityId` - Associated facility
- `facilityName` - Facility name
- `status` - Ticket status

#### Timestamps (JSON formatted):
```java
@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
private LocalDateTime createdAt;    // When ticket was created

@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
private LocalDateTime updatedAt;    // When ticket was last updated

@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
private LocalDateTime resolvedAt;   // When ticket was resolved

@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
private LocalDateTime closedAt;     // When ticket was closed by reporter

@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
private LocalDateTime slaDeadline;  // SLA target deadline
```

#### User Information:
- `reportedByName` - Person who reported the ticket
- `reportedById` - Reporter user ID
- `assignedToName` - Assigned technician name
- `assignedToId` - Assigned technician ID

#### Ticket Status & Metrics:
- `resolutionNotes` - Notes added by technician
- `rejectionReason` - Reason if rejected
- `preferredContact` - Contact preference
- `attachments` - List of AttachmentDTOs
- `slaViolated` - Boolean: whether SLA deadline was missed
- `timeElapsed` - Hours since ticket creation

### Response Example:
```json
{
  "id": 101,
  "title": "AC Unit Repair",
  "description": "AC is not cooling properly in Lab 3",
  "category": "ELECTRICAL",
  "priority": "HIGH",
  "location": "Building A, Lab 3",
  "facilityId": 5,
  "facilityName": "Main Campus",
  "status": "IN_PROGRESS",
  "reportedByName": "John Student",
  "reportedById": 42,
  "assignedToName": "Jane Technician",
  "assignedToId": 7,
  "resolutionNotes": null,
  "rejectionReason": null,
  "preferredContact": "0771234567",
  "createdAt": "2024-04-15T09:30:00",
  "updatedAt": "2024-04-18T14:15:00",
  "resolvedAt": null,
  "closedAt": null,
  "slaDeadline": "2024-04-15T17:30:00",
  "slaViolated": false,
  "timeElapsed": 77,
  "attachments": [
    {
      "id": 201,
      "originalName": "damage_photo.jpg",
      "url": "/api/tickets/101/attachments/uuid-12345.jpg",
      "mimeType": "image/jpeg",
      "size": 256000,
      "uploadDate": "2024-04-15T09:35:00"
    }
  ]
}
```

### Date Format:
- Pattern: `yyyy-MM-dd'T'HH:mm:ss`
- Example: `2024-04-18T14:32:45`
- Timezone: Always UTC (stored in database)

**Code Location:** `TicketResponseDTO.java` - DTO class

---

## Improved Error Messages Summary

### Ticket Not Found (404)
```
"Ticket #42 not found. The ticket may have been deleted or does not exist in the system. 
Please check the ticket ID and try again."
```

### Invalid Ticket ID (400)
```
"Invalid ticket ID. Please provide a valid positive integer."
```

### Access Denied - Technician Restrictions (403)
```
"Access denied. Only the assigned technician can update this ticket. 
If you believe this is an error, contact your administrator."
```

### Cannot Close Ticket - Wrong Status (409)
```
"Cannot close ticket. Only tickets with RESOLVED status can be closed by the reporter. 
Current status: IN_PROGRESS. 
Please mark the ticket as resolved first or contact a technician."
```

### Cannot Delete Resolved Ticket (409)
```
"Cannot delete a ticket that has been resolved or closed. 
Please contact an administrator if you need to remove this ticket."
```

### Resolution Notes Required (400)
```
"Resolution notes are required when marking a ticket as RESOLVED. 
Please provide details about how the issue was resolved."
```

### Empty Search Keyword (400)
```
"Search keyword cannot be empty. Please provide a search term to find tickets."
```

### Technician Not Found (404)
```
"Technician with ID 999 not found. Please verify the technician ID 
and ensure the user exists in the system."
```

---

## Files Modified

1. **`TicketRequestDTO.java`** - Enhanced validation annotations
2. **`TicketResponseDTO.java`** - Already had createdAt/updatedAt with proper formatting
3. **`TicketRepository.java`** - Added `searchByKeyword()` query method
4. **`TicketService.java`** - Added `searchTickets()` interface method
5. **`TicketServiceImpl.java`** - Implemented all improvements:
   - Enhanced `findTicketOrThrow()` with better error messages
   - Added `searchTickets()` with validation
   - Improved error messages throughout
   - Fixed HTTP status codes (404, 409, 403)
   - Added validation in all methods
6. **`TicketController.java`** - Added `/search` endpoint with pagination

---

## Database Schema (No Changes Required)

Existing fields support all new functionality:
- `created_at` - Tracking ticket creation
- `updated_at` - Tracking last update
- `title` - Text-searchable
- `description` - Text-searchable

---

## API Endpoints

### Get All Tickets (with Pagination & Filtering)
```
GET /api/tickets
  ?page=0
  &size=20
  &status=OPEN
  &category=ELECTRICAL
  &priority=HIGH
  &assignedToId=5
Authorization: Required (ADMIN/TECHNICIAN/MANAGER)
```

### Search Tickets
```
GET /api/tickets/search
  ?keyword=AC
  &page=0
  &size=20
  &sort=createdAt,desc
Authorization: Required (All authenticated users)
```

### Get My Tickets
```
GET /api/tickets/my
  ?page=0
  &size=20
Authorization: Required (Current user)
```

### Get Single Ticket
```
GET /api/tickets/{id}
Authorization: Required (Authenticated users)
```

---

## Compilation Status
✅ All files compile with **0 errors**

## Testing Checklist

- [ ] Create ticket with empty title → 400 error
- [ ] Create ticket with short title (< 3 chars) → 400 error
- [ ] Create ticket with long description → Works
- [ ] Get non-existent ticket #999 → 404 error with improved message
- [ ] Search with empty keyword → 400 error
- [ ] Search with 1 character → 400 error (must be 2+)
- [ ] Search for "AC" → Returns matching tickets
- [ ] Get all tickets with pagination → Page metadata included
- [ ] Get all tickets with filters → Returns filtered results
- [ ] Technician can only update assigned tickets → 403 if not assigned
- [ ] Can't delete resolved ticket → 409 error
- [ ] Can't close non-resolved ticket → 409 error with status shown
- [ ] Resolution notes required when resolving → 400 if empty

---

## Status: ✅ COMPLETE

All 7 requirements have been successfully implemented:
1. ✅ Better error messages when ticket not found
2. ✅ Validation — title/description cannot be empty
3. ✅ @NotNull annotations on ticket request DTO
4. ✅ Improved HTTP status codes (404 vs 500, 409, 403)
5. ✅ Add pagination to get all tickets endpoint
6. ✅ Add ticket search by keyword
7. ✅ Improve ticket response DTO (createdAt, updatedAt)

**Ready for:** Testing and deployment
