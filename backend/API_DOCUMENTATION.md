# Smart Campus Maintenance System - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Error Handling](#error-handling)
5. [API Endpoints](#api-endpoints)
   - [Authentication](#auth-endpoints)
   - [Users (Admin Only)](#user-endpoints)
   - [Tickets](#ticket-endpoints)
   - [Comments](#comment-endpoints)
6. [Data Models](#data-models)
7. [Status Codes](#status-codes)

---

## Overview

The Smart Campus Maintenance System API provides endpoints for managing facility maintenance tickets, user accounts, and comments. The system supports three user roles:
- **USER**: Campus users who can create and view their own tickets
- **TECHNICIAN**: Staff who can view assigned/all tickets and update status
- **ADMIN**: Administrators who manage users, technicians, and all tickets

---

## Base URL

```
http://localhost:8080/api
```

or in production:
```
https://your-domain.com/api
```

---

## Authentication

All endpoints (except `/auth/google` and `/auth/login`) require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The JWT token is obtained through:
1. Google OAuth login
2. Password-based login

Tokens expire after 24 hours and must be refreshed by re-authenticating.

For detailed authentication flow, see [AUTHENTICATION.md](./AUTHENTICATION.md)

---

## Error Handling

The API returns standardized error responses with appropriate HTTP status codes. All error responses follow this format:

```json
{
  "timestamp": "2026-03-29T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/tickets",
  "details": [
    {
      "field": "category",
      "message": "must not be null"
    }
  ]
}
```

For detailed error codes and handling strategies, see [ERROR_HANDLING.md](./ERROR_HANDLING.md)

---

## API Endpoints

### Auth Endpoints

#### 1. Google OAuth Sign-In
**Endpoint:** `POST /auth/google`

Sign in using a Google OAuth ID token.

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImFiY2RlZiJ9..."
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "enabled": true,
    "profileImageUrl": "https://lh3.googleusercontent.com/..."
  }
}
```

**Status Codes:**
- `200 OK` - Successfully authenticated
- `400 Bad Request` - Invalid token
- `401 Unauthorized` - Google OAuth verification failed

**Error Codes:**
- `INVALID_ID_TOKEN` - Token format is invalid
- `TOKEN_VERIFICATION_FAILED` - Google verification failed
- `USER_DISABLED` - Account is disabled

---

#### 2. Password-Based Login
**Endpoint:** `POST /auth/login`

Sign in using email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TECHNICIAN",
    "enabled": true,
    "profileImageUrl": null
  }
}
```

**Status Codes:**
- `200 OK` - Successfully authenticated
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account disabled

---

#### 3. Get Current User Profile
**Endpoint:** `GET /auth/me`

Get the profile of the currently authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "TECHNICIAN",
  "enabled": true,
  "profileImageUrl": "https://..."
}
```

**Status Codes:**
- `200 OK` - User profile retrieved
- `401 Unauthorized` - No valid token
- `403 Forbidden` - Token expired

---

### User Endpoints

> **Access Control:** All endpoints require `ADMIN` role

#### 1. List All Users
**Endpoint:** `GET /users`

Retrieve paginated list of all users.

**Query Parameters:**
```
page=0          (default: 0)
size=10         (default: 10)
sort=createdAt:desc
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "TECHNICIAN",
      "enabled": true,
      "profileImageUrl": null,
      "createdAt": "2026-03-01T08:00:00Z",
      "updatedAt": "2026-03-29T10:00:00Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalPages": 1,
    "totalElements": 5
  }
}
```

**Status Codes:**
- `200 OK` - Users retrieved
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions

---

#### 2. List All Technicians
**Endpoint:** `GET /users/technicians`

Retrieve all technicians (users with TECHNICIAN role).

**Query Parameters:**
```
page=0          (default: 0)
size=10         (default: 10)
sort=firstName:asc
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 2,
      "email": "tech1@example.com",
      "firstName": "Alice",
      "lastName": "Smith",
      "role": "TECHNICIAN",
      "enabled": true,
      "profileImageUrl": null
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalPages": 1,
    "totalElements": 3
  }
}
```

---

#### 3. Create Technician
**Endpoint:** `POST /users/technicians`

Create a new technician account.

**Request:**
```json
{
  "email": "newtechnic@example.com",
  "firstName": "Bob",
  "lastName": "Johnson",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "id": 5,
  "email": "newtechnic@example.com",
  "firstName": "Bob",
  "lastName": "Johnson",
  "role": "TECHNICIAN",
  "enabled": true,
  "profileImageUrl": null
}
```

**Validation Rules:**
- `email`: Valid email format, must be unique
- `firstName`: Non-empty, max 100 characters
- `lastName`: Non-empty, max 100 characters
- `password`: Minimum 8 characters, must include uppercase, lowercase, number, and special character

**Status Codes:**
- `201 Created` - Technician created
- `400 Bad Request` - Validation failed
- `409 Conflict` - Email already exists

---

#### 4. Update Technician
**Endpoint:** `PATCH /users/technicians/{id}`

Update technician details.

**Path Parameters:**
- `id` - Technician ID (numeric)

**Request:**
```json
{
  "firstName": "Bobby",
  "lastName": "Johnson Jr.",
  "email": "bobby.johnson@example.com"
}
```

**Response (200 OK):**
```json
{
  "id": 5,
  "email": "bobby.johnson@example.com",
  "firstName": "Bobby",
  "lastName": "Johnson Jr.",
  "role": "TECHNICIAN",
  "enabled": true
}
```

**Status Codes:**
- `200 OK` - Updated successfully
- `400 Bad Request` - Validation failed
- `404 Not Found` - Technician not found
- `409 Conflict` - Email already taken

---

#### 5. Delete Technician
**Endpoint:** `DELETE /users/technicians/{id}`

Delete a technician account.

**Path Parameters:**
- `id` - Technician ID (numeric)

**Response (204 No Content):**

No response body.

**Status Codes:**
- `204 No Content` - Deleted successfully
- `404 Not Found` - Technician not found
- `409 Conflict` - Cannot delete (has pending assignments)

---

#### 6. Get User by ID
**Endpoint:** `GET /users/{id}`

Retrieve a specific user by ID.

**Path Parameters:**
- `id` - User ID (numeric)

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "enabled": true,
  "profileImageUrl": "https://...",
  "createdAt": "2026-03-01T08:00:00Z"
}
```

**Status Codes:**
- `200 OK` - User retrieved
- `404 Not Found` - User not found

---

#### 7. Update User Role
**Endpoint:** `PATCH /users/{id}/role`

Change a user's role.

**Path Parameters:**
- `id` - User ID (numeric)

**Request:**
```json
{
  "role": "TECHNICIAN"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "TECHNICIAN",
  "enabled": true
}
```

**Valid Roles:**
- `USER` - Regular campus user
- `TECHNICIAN` - Maintenance staff
- `ADMIN` - Administrator

**Status Codes:**
- `200 OK` - Role updated
- `400 Bad Request` - Invalid role
- `404 Not Found` - User not found

---

#### 8. Toggle User Enabled Status
**Endpoint:** `PATCH /users/{id}/enable`

Enable or disable a user account.

**Path Parameters:**
- `id` - User ID (numeric)

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "enabled": false
}
```

**Status Codes:**
- `200 OK` - Status toggled
- `404 Not Found` - User not found

---

### Ticket Endpoints

#### 1. List All Tickets
**Endpoint:** `GET /tickets`

> **Access Control:** `ADMIN` or `TECHNICIAN` role required

Retrieve paginated list of all tickets with optional filters.

**Query Parameters:**
```
status=OPEN             (optional: OPEN, IN_PROGRESS, RESOLVED, CLOSED)
category=PLUMBING       (optional: PLUMBING, ELECTRICAL, CARPENTRY, etc.)
priority=HIGH           (optional: LOW, MEDIUM, HIGH, CRITICAL)
assignedToId=2          (optional: user ID)
page=0                  (default: 0)
size=10                 (default: 10)
sort=createdAt:desc     (default)
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "title": "Broken Ceiling Light",
      "description": "Light in room 101 is not working",
      "category": "ELECTRICAL",
      "priority": "HIGH",
      "status": "OPEN",
      "createdByUserId": 10,
      "createdBy": "John Doe",
      "assignedToId": 2,
      "assignedTo": "Alice Smith",
      "createdAt": "2026-03-28T14:30:00Z",
      "updatedAt": "2026-03-28T14:30:00Z",
      "resolvedAt": null,
      "attachments": [
        {
          "id": 1,
          "originalName": "ceiling-light.jpg",
          "storedName": "stored_uuid_name.jpg",
          "fileSize": 245000,
          "uploadedAt": "2026-03-28T14:30:00Z"
        }
      ]
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalPages": 3,
    "totalElements": 25
  }
}
```

**Status Codes:**
- `200 OK` - Tickets retrieved
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions

---

#### 2. Get My Tickets
**Endpoint:** `GET /tickets/my`

> **Access Control:** All authenticated users

Retrieve tickets created by or assigned to the current user.

**Query Parameters:**
```
page=0          (default: 0)
size=10         (default: 10)
sort=createdAt:desc
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 5,
      "title": "Leaky Faucet",
      "description": "Faucet in bathroom is leaking",
      "category": "PLUMBING",
      "priority": "MEDIUM",
      "status": "IN_PROGRESS",
      "createdByUserId": 10,
      "createdBy": "John Doe",
      "assignedToId": 2,
      "assignedTo": "Alice Smith",
      "createdAt": "2026-03-27T10:00:00Z",
      "updatedAt": "2026-03-28T15:45:00Z",
      "resolvedAt": null,
      "attachments": []
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalPages": 1,
    "totalElements": 5
  }
}
```

**Status Codes:**
- `200 OK` - Tickets retrieved
- `401 Unauthorized` - Not authenticated

---

#### 3. Get Assigned Tickets (Technician)
**Endpoint:** `GET /tickets/assigned`

> **Access Control:** `TECHNICIAN` or `ADMIN` role required

Retrieve tickets assigned to the current technician.

**Query Parameters:**
```
page=0          (default: 0)
size=10         (default: 10)
```

**Response (200 OK):**
Same structure as /tickets

---

#### 4. Get Technician Performance Analytics
**Endpoint:** `GET /tickets/analytics/technician-performance`

> **Access Control:** `ADMIN` role required

Retrieve performance metrics for all technicians.

**Response (200 OK):**
```json
[
  {
    "technicianId": 2,
    "technicianName": "Alice Smith",
    "totalAssigned": 15,
    "completed": 12,
    "pending": 3,
    "averageResolutionTime": 2.5,
    "completionRate": 80.0,
    "criticalResolved": 3,
    "highResolved": 5
  }
]
```

**Status Codes:**
- `200 OK` - Analytics retrieved
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - ADMIN role required

---

#### 5. Export Tickets to CSV
**Endpoint:** `GET /tickets/export`

> **Access Control:** `ADMIN` role required

Export filtered tickets as CSV file.

**Query Parameters:**
```
status=OPEN             (optional)
category=ELECTRICAL     (optional)
```

**Response (200 OK):**
```
Content-Type: text/csv; charset=UTF-8
Content-Disposition: attachment; filename="tickets.csv"

ID,Title,Description,Category,Priority,Status,Created By,Assigned To,Created At
1,Broken Ceiling Light,Light not working,ELECTRICAL,HIGH,OPEN,John Doe,Alice Smith,2026-03-28T14:30:00Z
...
```

**Status Codes:**
- `200 OK` - CSV file returned
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - ADMIN role required

---

#### 6. Get Ticket by ID
**Endpoint:** `GET /tickets/{id}`

> **Access Control:** All authenticated users (users see only own tickets)

Retrieve a specific ticket.

**Path Parameters:**
- `id` - Ticket ID (numeric)

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Broken Ceiling Light",
  "description": "Light in room 101 is not working",
  "location": "Building A, Room 101",
  "category": "ELECTRICAL",
  "priority": "HIGH",
  "status": "OPEN",
  "createdByUserId": 10,
  "createdBy": "John Doe",
  "assignedToId": 2,
  "assignedTo": "Alice Smith",
  "createdAt": "2026-03-28T14:30:00Z",
  "updatedAt": "2026-03-28T14:30:00Z",
  "resolvedAt": null,
  "attachments": [
    {
      "id": 1,
      "originalName": "ceiling-light.jpg",
      "storedName": "uuid_stored_name.jpg",
      "fileSize": 245000,
      "uploadedAt": "2026-03-28T14:30:00Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Ticket retrieved
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Cannot view other users' tickets
- `404 Not Found` - Ticket not found

---

#### 7. Create Ticket
**Endpoint:** `POST /tickets`

> **Access Control:** Regular `USER` only (not ADMIN or TECHNICIAN)

Create a new maintenance ticket with optional file attachments.

**Content-Type:** `multipart/form-data`

**Form Fields:**
```
ticket (JSON):
{
  "title": "Broken Ceiling Light",
  "description": "The light in room 101 is not working",
  "location": "Building A, Room 101",
  "category": "ELECTRICAL",
  "priority": "HIGH"
}

files (optional, multiple):
- files[0]: <binary file data>
- files[1]: <binary file data>
```

**Response (201 Created):**
```json
{
  "id": 1,
  "title": "Broken Ceiling Light",
  "description": "The light in room 101 is not working",
  "location": "Building A, Room 101",
  "category": "ELECTRICAL",
  "priority": "HIGH",
  "status": "OPEN",
  "createdByUserId": 10,
  "createdBy": "John Doe",
  "assignedToId": null,
  "assignedTo": null,
  "createdAt": "2026-03-29T09:00:00Z",
  "updatedAt": "2026-03-29T09:00:00Z",
  "resolvedAt": null,
  "attachments": [
    {
      "id": 1,
      "originalName": "photo.jpg",
      "storedName": "stored_uuid.jpg",
      "fileSize": 512345,
      "uploadedAt": "2026-03-29T09:00:00Z"
    }
  ]
}
```

**Validation Rules:**
- `title`: Non-empty, max 255 characters
- `description`: Non-empty, max 5000 characters
- `location`: Non-empty, max 255 characters
- `category`: Must be valid category (PLUMBING, ELECTRICAL, CARPENTRY, etc.)
- `priority`: Must be LOW, MEDIUM, HIGH, or CRITICAL
- Files: Max 5 files, each max 10MB, total max 50MB
- Allowed formats: jpg, jpeg, png, pdf, doc, docx

**Status Codes:**
- `201 Created` - Ticket created
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Only USERS can create (not ADMIN/TECHNICIAN)
- `413 Payload Too Large` - Files exceed size limits

---

#### 8. Update Ticket Status
**Endpoint:** `PATCH /tickets/{id}/status`

> **Access Control:** `ADMIN` or `TECHNICIAN` role required

Update the status of a ticket.

**Path Parameters:**
- `id` - Ticket ID (numeric)

**Request:**
```json
{
  "status": "IN_PROGRESS",
  "techniciansNote": "Started working on the issue"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Broken Ceiling Light",
  "description": "Light in room 101 is not working",
  "category": "ELECTRICAL",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "createdByUserId": 10,
  "createdBy": "John Doe",
  "assignedToId": 2,
  "assignedTo": "Alice Smith",
  "createdAt": "2026-03-28T14:30:00Z",
  "updatedAt": "2026-03-29T10:00:00Z",
  "resolvedAt": null,
  "attachments": []
}
```

**Valid Status Transitions:**
```
OPEN → IN_PROGRESS, CLOSED
IN_PROGRESS → RESOLVED, OPEN
RESOLVED → CLOSED
CLOSED → (terminal state)
```

**Status Codes:**
- `200 OK` - Status updated
- `400 Bad Request` - Invalid status transition
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Ticket not found

---

#### 9. Assign Technician to Ticket
**Endpoint:** `PATCH /tickets/{id}/assign`

> **Access Control:** `ADMIN` role required

Assign a technician to a ticket.

**Path Parameters:**
- `id` - Ticket ID (numeric)

**Query Parameters:**
```
technicianId=2    (required: ID of technician)
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Broken Ceiling Light",
  "description": "Light in room 101 is not working",
  "category": "ELECTRICAL",
  "priority": "HIGH",
  "status": "OPEN",
  "createdByUserId": 10,
  "createdBy": "John Doe",
  "assignedToId": 2,
  "assignedTo": "Alice Smith",
  "createdAt": "2026-03-28T14:30:00Z",
  "updatedAt": "2026-03-29T10:15:00Z",
  "resolvedAt": null,
  "attachments": []
}
```

**Status Codes:**
- `200 OK` - Assigned successfully
- `400 Bad Request` - Invalid technician ID
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - ADMIN role required
- `404 Not Found` - Ticket or technician not found

---

#### 10. Delete Ticket
**Endpoint:** `DELETE /tickets/{id}`

> **Access Control:** `ADMIN` role required

Delete a ticket permanently.

**Path Parameters:**
- `id` - Ticket ID (numeric)

**Response (204 No Content):**

No response body.

**Notes:**
- Can only delete tickets with status OPEN or CLOSED
- Cannot delete tickets with pending assignments or comments

**Status Codes:**
- `204 No Content` - Deleted successfully
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - ADMIN role required
- `404 Not Found` - Ticket not found
- `409 Conflict` - Ticket cannot be deleted (has pending work)

---

#### 11. Download Attachment
**Endpoint:** `GET /tickets/{id}/attachments/{storedName:.+}`

> **Access Control:** All authenticated users

Download a file attachment from a ticket.

**Path Parameters:**
- `id` - Ticket ID (numeric)
- `storedName` - Stored file name (URL encoded)

**Response (200 OK):**
```
Content-Type: image/jpeg (or appropriate MIME type)
Content-Disposition: attachment; filename="ceiling-light.jpg"
Content-Length: 245000

<binary file data>
```

**Status Codes:**
- `200 OK` - File downloaded
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Cannot access other users' tickets
- `404 Not Found` - Ticket or attachment not found
- `304 Not Modified` - File cached (if-none-match header)

---

### Comment Endpoints

#### 1. Get Ticket Comments
**Endpoint:** `GET /tickets/{ticketId}/comments`

> **Access Control:** All authenticated users

Retrieve all comments for a ticket.

**Path Parameters:**
- `ticketId` - Ticket ID (numeric)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "ticketId": 1,
    "content": "Started investigating the electrical issue.",
    "authorId": 2,
    "author": "Alice Smith",
    "authorRole": "TECHNICIAN",
    "createdAt": "2026-03-29T10:00:00Z",
    "updatedAt": "2026-03-29T10:00:00Z",
    "isEdited": false,
    "isInternal": false
  }
]
```

**Status Codes:**
- `200 OK` - Comments retrieved
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Cannot view other users' tickets
- `404 Not Found` - Ticket not found

---

#### 2. Add Comment to Ticket
**Endpoint:** `POST /tickets/{ticketId}/comments`

> **Access Control:** All authenticated users

Add a comment to a ticket.

**Path Parameters:**
- `ticketId` - Ticket ID (numeric)

**Request:**
```json
{
  "content": "The issue has been resolved. Light bulb was replaced."
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "ticketId": 1,
  "content": "The issue has been resolved. Light bulb was replaced.",
  "authorId": 2,
  "author": "Alice Smith",
  "authorRole": "TECHNICIAN",
  "createdAt": "2026-03-29T10:30:00Z",
  "updatedAt": "2026-03-29T10:30:00Z",
  "isEdited": false,
  "isInternal": false
}
```

**Validation Rules:**
- `content`: Non-empty, max 5000 characters

**Status Codes:**
- `201 Created` - Comment added
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Cannot comment on other users' tickets
- `404 Not Found` - Ticket not found

---

#### 3. Edit Comment
**Endpoint:** `PUT /tickets/{ticketId}/comments/{commentId}`

> **Access Control:** Comment author or ADMIN

Edit an existing comment.

**Path Parameters:**
- `ticketId` - Ticket ID (numeric)
- `commentId` - Comment ID (numeric)

**Request:**
```json
{
  "content": "The issue has been resolved. Light bulb was replaced. Thanks!"
}
```

**Response (200 OK):**
```json
{
  "id": 2,
  "ticketId": 1,
  "content": "The issue has been resolved. Light bulb was replaced. Thanks!",
  "authorId": 2,
  "author": "Alice Smith",
  "authorRole": "TECHNICIAN",
  "createdAt": "2026-03-29T10:30:00Z",
  "updatedAt": "2026-03-29T10:35:00Z",
  "isEdited": true,
  "isInternal": false
}
```

**Status Codes:**
- `200 OK` - Comment updated
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Cannot edit other users' comments
- `404 Not Found` - Comment or ticket not found

---

#### 4. Delete Comment
**Endpoint:** `DELETE /tickets/{ticketId}/comments/{commentId}`

> **Access Control:** Comment author or ADMIN

Delete a comment.

**Path Parameters:**
- `ticketId` - Ticket ID (numeric)
- `commentId` - Comment ID (numeric)

**Response (204 No Content):**

No response body.

**Status Codes:**
- `204 No Content` - Comment deleted
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Cannot delete other users' comments
- `404 Not Found` - Comment or ticket not found

---

## Data Models

### User
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "enabled": true,
  "profileImageUrl": "https://...",
  "createdAt": "2026-03-01T08:00:00Z",
  "updatedAt": "2026-03-29T10:00:00Z"
}
```

**Fields:**
- `id` (number): Unique user identifier
- `email` (string): User email, must be unique
- `firstName` (string): First name
- `lastName` (string): Last name
- `role` (enum): USER, TECHNICIAN, or ADMIN
- `enabled` (boolean): Account status
- `profileImageUrl` (string, nullable): URL to profile image
- `createdAt` (ISO 8601): Account creation timestamp
- `updatedAt` (ISO 8601): Last update timestamp

### Ticket
```json
{
  "id": 1,
  "title": "Broken Ceiling Light",
  "description": "The light in room 101 is not working",
  "location": "Building A, Room 101",
  "category": "ELECTRICAL",
  "priority": "HIGH",
  "status": "OPEN",
  "createdByUserId": 10,
  "createdBy": "John Doe",
  "assignedToId": 2,
  "assignedTo": "Alice Smith",
  "createdAt": "2026-03-28T14:30:00Z",
  "updatedAt": "2026-03-28T14:30:00Z",
  "resolvedAt": null,
  "attachments": []
}
```

**Fields:**
- `id` (number): Unique ticket identifier
- `title` (string): Ticket title
- `description` (string): Detailed description
- `location` (string): Location of the issue
- `category` (enum): PLUMBING, ELECTRICAL, CARPENTRY, HVAC, GENERAL, etc.
- `priority` (enum): LOW, MEDIUM, HIGH, CRITICAL
- `status` (enum): OPEN, IN_PROGRESS, RESOLVED, CLOSED
- `createdBy` (object): User who created the ticket
- `assignedTo` (object, nullable): Technician assigned to ticket
- `createdAt` (ISO 8601): Creation timestamp
- `updatedAt` (ISO 8601): Last update timestamp
- `resolvedAt` (ISO 8601, nullable): When ticket was resolved
- `attachments` (array): File attachments

### Comment
```json
{
  "id": 1,
  "ticketId": 1,
  "content": "Started investigating the issue.",
  "authorId": 2,
  "author": "Alice Smith",
  "authorRole": "TECHNICIAN",
  "createdAt": "2026-03-29T10:00:00Z",
  "updatedAt": "2026-03-29T10:00:00Z",
  "isEdited": false,
  "isInternal": false
}
```

**Fields:**
- `id` (number): Unique comment identifier
- `ticketId` (number): Associated ticket ID
- `content` (string): Comment text
- `authorId` (number): User who wrote the comment
- `author` (string): Author's name
- `authorRole` (enum): Author's role (USER, TECHNICIAN, ADMIN)
- `createdAt` (ISO 8601): Creation timestamp
- `updatedAt` (ISO 8601): Last update timestamp
- `isEdited` (boolean): Whether comment has been edited
- `isInternal` (boolean): Whether comment is internal-only

### Attachment
```json
{
  "id": 1,
  "originalName": "ceiling-light.jpg",
  "storedName": "uuid_stored_name.jpg",
  "fileSize": 245000,
  "uploadedAt": "2026-03-28T14:30:00Z"
}
```

**Fields:**
- `id` (number): Unique attachment identifier
- `originalName` (string): Original filename
- `storedName` (string): Stored filename (UUID-based)
- `fileSize` (number): File size in bytes
- `uploadedAt` (ISO 8601): Upload timestamp

---

## Status Codes

### Success Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |

### Client Error Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Sufficient authentication but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (duplicate email, invalid state) |
| 413 | Payload Too Large | File upload exceeds size limits |

### Server Error Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Server temporarily unavailable |

---

## Pagination

Many endpoints support pagination. Responses include pagination metadata:

```json
{
  "content": [...],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalPages": 5,
    "totalElements": 50
  }
}
```

**Query Parameters:**
- `page`: Zero-indexed page number (default: 0)
- `size`: Number of items per page (default: 10, max: 100)
- `sort`: Sort field and direction, e.g., `createdAt:desc`, `firstName:asc`

---

## Rate Limiting

Currently no rate limiting is implemented. Future versions may add:
- 100 requests per minute per IP
- 1000 requests per hour per user

---

## WebSocket Endpoints

Real-time notifications are available via WebSocket:

```
ws://localhost:8080/ws/tickets/{ticketId}
```

**Message Format:**
```json
{
  "type": "COMMENT_ADDED",
  "data": {
    "commentId": 1,
    "author": "Alice Smith",
    "content": "Status update...",
    "timestamp": "2026-03-29T10:00:00Z"
  }
}
```

---

## API Playground

Interactive API documentation is available at:
```
http://localhost:8080/swagger-ui/index.html
```

---

## Support

For issues or questions:
- Email: support@smartcampus.edu
- Issue Tracker: https://github.com/yourorg/smart-campus/issues
