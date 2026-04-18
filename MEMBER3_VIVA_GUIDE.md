# MEMBER 3 VIVA GUIDE — Maintenance & Incident Ticketing System

**Candidate:** Member 3  
**Module:** Smart Campus Hub — Maintenance & Incident Ticketing  
**Date Prepared:** March 29, 2026  
**Status:** Complete & Ready for Viva  

---

## 📋 TABLE OF CONTENTS

1. [Quick Overview](#quick-overview)
2. [Your Scope & Responsibilities](#your-scope--responsibilities)
3. [System Architecture](#system-architecture)
4. [Database Design & Data Models](#database-design--data-models)
5. [Backend Implementation (Spring Boot)](#backend-implementation-spring-boot)
6. [Frontend Implementation (React/Vite)](#frontend-implementation-reactvite)
7. [Key Features Explained](#key-features-explained)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [Testing Strategy](#testing-strategy)
10. [Innovation Features](#innovation-features)
11. [Running & Verification](#running--verification)
12. [Viva Q&A Preparation](#viva-qa-preparation)
13. [Related Documentation](#related-documentation)

---

## QUICK OVERVIEW

### What You Built
You built the **Maintenance & Incident Ticketing Module** for Smart Campus — a full-stack feature that allows:
- **Campus Users** to create and track maintenance tickets
- **Technicians** to receive assignments and update ticket status
- **Admins** to manage the entire ticket queue, technician roster, and analytics

### Tech Stack
| Layer | Technology |
|-------|-----------|
| **Backend** | Spring Boot 2.x, JPA/Hibernate, PostgreSQL |
| **Frontend** | React (Vite), Axios, Tailwind CSS |
| **Auth** | JWT + Google OAuth, role-based access control |
| **File Storage** | Supabase Storage (cloud-based, not local) |
| **Scheduling** | Spring `@Scheduled` for SLA escalation |
| **API Docs** | Springdoc OpenAPI + Swagger UI |

### Status: ✅ **COMPLETE**
- All features implemented and integrated
- Unit and integration tests in place
- Frontend components tested (Vitest)
- API fully documented
- Ready for production

---

## YOUR SCOPE & RESPONSIBILITIES

### User Roles & Permissions

| Role | Can Do |
|------|--------|
| **USER** | Create own tickets, view own tickets & updates |
| **TECHNICIAN** | View assigned tickets, update status, add comments, see performance metrics |
| **ADMIN** | View all tickets, assign technicians, manage entire queue, user admin, export CSV, escalate/resolve |

### Core Features (What You Delivered)

#### 1. **Ticket Creation**
- Multi-step form with category, priority, location, facility link
- Multi-file image attachment (max 3 files, 5MB each)
- Form validation & error handling
- Images stored in **Supabase Storage** (not local disk)

#### 2. **Ticket Management**
- View tickets filtered by status, category, priority, assignee
- Status workflow: OPEN → IN_PROGRESS → RESOLVED → CLOSED
- Admin can assign technicians, bulk operations
- Users see only their own tickets; staff see assigned/all

#### 3. **Ticket Detail & Timeline**
- Full ticket view with metadata, SLA timer, status stepper
- Comment thread (user → admin/technician interaction)
- Attachment gallery with **image lightbox**
- Real-time updates (using `useTicketUpdates` hook)

#### 4. **Technician Dashboard**
- Live assigned tickets with status
- Performance metrics (resolved, average resolution time)
- Workload visualization
- Schedule status placeholder for future expansion

#### 5. **Admin Panel**
- Staff table (tickets by assignee)
- Performance analytics (technician stats)
- Bulk actions (assign, delete, resolve)
- CSV export for reporting

#### 6. **SLA & Escalation** *(Innovation)*
- SLA timer UI showing time until deadline
- Automatic priority escalation: LOW → MEDIUM after 48h if still OPEN
- Visual breach warning
- Admin receives escalation alerts

#### 7. **Image Attachments & Lightbox** *(Innovation)*
- Drag-and-drop upload zone (react-dropzone)
- Image lightbox for gallery navigation
- MIME type validation (jpeg, png, webp)
- Responsive image display

#### 8. **Comments & Collaboration**
- Users, technicians, admins can comment
- Edit own comments (author only)
- Admin can delete any comment
- Real-time comment display

---

## SYSTEM ARCHITECTURE

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React/Vite)                  │
├─────────────────────────────────────────────────────────────┤
│  Pages:  MyTickets | CreateTicket | TicketDetail | Dashboard │
│  Components: TicketCard, SlaTimer, ImageLightbox, Comments  │
│  API Client: ticketApi.js (axios)                          │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST (JWT auth)
┌──────────────────▼──────────────────────────────────────────┐
│                  BACKEND (Spring Boot)                       │
├──────────────────────────────────────────────────────────────┤
│  REST API:  TicketController, CommentController             │
│  Service:   TicketService, CommentService, AttachmentSvc    │
│  Repo:      TicketRepository, CommentRepository              │
│  Jobs:      SlaEscalationJob (every 30 min)                 │
│  Security:  SecurityConfig, JWT filter chain                │
└──────────────────┬──────────────────────────────────────────┘
                   │ SQL / ORM (JPA/Hibernate)
┌──────────────────▼──────────────────────────────────────────┐
│                 DATABASE (PostgreSQL)                        │
├──────────────────────────────────────────────────────────────┤
│  Tables: ticket, comment, attachment, user, technician_perf │
│  Schema: schema.sql in resources                            │
└──────────────────────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│           SUPABASE STORAGE (Cloud File Storage)              │
├──────────────────────────────────────────────────────────────┤
│  Bucket: "smart-campus-uploads"                             │
│  Storage: ticket/{ticketId}/{uuid}.{ext}                    │
└──────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
User Login (Google OAuth or Email/Password)
       │
       ▼
   /auth/google  or  /auth/login
       │
       ▼
Backend validates token
       │
       ▼
Returns JWT + User profile
       │
       ▼
Frontend stores JWT in authTokenMemory
       │
       ▼
All subsequent requests include: Authorization: Bearer <JWT>
```

### Ticket Lifecycle

```
┌─────────────────────────────────────────┐
│  USER: CREATE TICKET                    │
│  Status: OPEN                           │
│  Priority: LOW/MEDIUM/HIGH/CRITICAL     │
│  SLA Deadline: calculated from policy   │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼──────────┐
        │ ADMIN ASSIGNS     │
        │ Status→IN_PROGRESS│
        └────────┬──────────┘
                 │
      ┌──────────▼───────────┐
      │ TECHNICIAN WORKS      │
      │ Adds comments/updates │
      └──────────┬────────────┘
                 │
        ┌────────▼──────────────┐
        │ TECHNICIAN: RESOLVED  │
        │ Status: RESOLVED      │
        │ (resolution metadata) │
        └────────┬──────────────┘
                 │
        ┌────────▼──────────────┐
        │ ADMIN: CLOSED         │
        │ Final status: CLOSED  │
        │ (archived)            │
        └───────────────────────┘
```

---

## DATABASE DESIGN & DATA MODELS

### Core Entities

#### 1. **Ticket**
```sql
CREATE TABLE ticket (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),              -- PLUMBING, ELECTRICAL, etc.
  priority VARCHAR(20),               -- LOW, MEDIUM, HIGH, CRITICAL
  status VARCHAR(20) DEFAULT 'OPEN',  -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
  created_date TIMESTAMP,
  created_by_id BIGINT REFERENCES user(id),
  assigned_to_id BIGINT REFERENCES user(id),
  facility_id BIGINT REFERENCES facility(id),
  location_description VARCHAR(255),
  sla_deadline TIMESTAMP,             -- Calculated from SlaPolicy
  sla_breached BOOLEAN DEFAULT FALSE,
  resolution_metadata JSONB,          -- { resolvedAt, closedAt, ... }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields Explained:**
- `category`: PLUMBING, ELECTRICAL, CLEANING, HVAC, LANDSCAPING, OTHER
- `priority`: LOW (72h SLA), MEDIUM (24h), HIGH (8h), CRITICAL (2h)
- `status`: Follows workflow above (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
- `sla_deadline`: Set at creation; escalation job checks against current time
- `resolution_metadata`: JSON storing resolved_at, closed_at, resolved_by_id, closed_by_id

#### 2. **Comment**
```sql
CREATE TABLE comment (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id BIGINT REFERENCES ticket(id) ON DELETE CASCADE,
  created_by_id BIGINT REFERENCES user(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Business Rules:**
- Author can edit/delete own comment
- Admin can delete ANY comment
- Comments deleted when ticket deleted (CASCADE)

#### 3. **Attachment**
```sql
CREATE TABLE attachment (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id BIGINT REFERENCES ticket(id) ON DELETE CASCADE,
  original_name VARCHAR(255),        -- "photo.png"
  stored_name VARCHAR(255) UNIQUE,   -- "uuid-abc123.png"
  mime_type VARCHAR(100),            -- "image/jpeg", etc.
  size BIGINT,                       -- Bytes
  file_url VARCHAR(500),             -- Supabase URL
  uploaded_by_id BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Storage Details:**
- Max 3 files per ticket
- Max 5MB each file
- Allowed MIME: `image/jpeg`, `image/png`, `image/webp`
- Stored in **Supabase Storage** (path: `ticket/{ticketId}/{storedName}`)

#### 4. **User** (from user module, referenced here)
```
- id, email, name, role (USER, TECHNICIAN, ADMIN)
- googleId (for OAuth)
- passwordHash (for email/password)
```

#### 5. **TechnicianPerformance** (calculated from queries)
```
- technician_id
- tickets_resolved: COUNT(*) WHERE status='CLOSED'
- avg_resolution_time: AVG(closed_at - created_at)
- active_tickets: COUNT(*) WHERE status IN ('OPEN', 'IN_PROGRESS')
- (Built from queries, not stored table)
```

### Relationships

```
User (1) ──── (M) Ticket (created_by, assigned_to)
          ──── (M) Comment (created_by)
          ──── (M) Attachment (uploaded_by)
Ticket (1) ──── (M) Comment
       ──── (M) Attachment
```

---

## BACKEND IMPLEMENTATION (Spring Boot)

### Project Structure

```
backend/src/main/java/com/smartcampus/maintenance/
├── MaintenanceApplication.java              # @SpringBootApplication, scheduling
├── config/
│   ├── SecurityConfig.java                  # CORS, JWT filter, route rules
│   └── DevAuthFilter.java                   # Dev-only auth bypass
├── controller/
│   ├── TicketController.java                # REST: /api/tickets/*
│   ├── CommentController.java               # REST: /api/tickets/{id}/comments/*
│   └── RootController.java                  # Health check, etc.
├── dto/                                     # Request/Response objects
│   ├── TicketRequest.java
│   ├── TicketResponse.java
│   ├── CommentDTO.java
│   ├── StatusUpdateRequest.java
│   ├── AssignmentRequest.java
│   ├── AttachmentDTO.java
│   └── TechnicianPerformanceDTO.java
├── event/                                   # Event system
│   ├── TicketStatusChangedEvent.java
│   └── NewCommentEvent.java
├── model/                                   # JPA entities
│   ├── Ticket.java
│   ├── Comment.java
│   ├── Attachment.java
│   └── enums/
│       ├── TicketStatus.java
│       ├── Priority.java
│       └── TicketCategory.java
├── policy/
│   └── SlaPolicy.java                       # SLA rules (hours per priority)
├── repository/
│   ├── TicketRepository.java                # Custom queries
│   ├── CommentRepository.java
│   └── AttachmentRepository.java
├── scheduler/
│   └── SlaEscalationJob.java                # @Scheduled task (every 30 min)
└── service/
    ├── TicketService.java / TicketServiceImpl.java
    ├── CommentService.java / CommentServiceImpl.java
    ├── AttachmentService.java                # Validation + Supabase upload
    └── SupabaseStorageService.java          # S3/Supabase integration
```

### Key Classes Deep Dive

#### **TicketService**

**Responsibilities:**
- Create ticket (multipart upload)
- List/filter tickets (with pagination, role-based)
- Get single ticket (with access control)
- Update status (workflow validation)
- Assign technician
- Delete ticket (admin only)
- Export to CSV

**Access Control:**
```
GET /api/tickets          → ADMIN, TECHNICIAN (all) | USER (own only)
GET /api/tickets/my       → Any authenticated user
GET /api/tickets/assigned → TECHNICIAN, ADMIN
POST /api/tickets         → Not ADMIN or TECHNICIAN (prevents staff creation)
PATCH /api/status         → ADMIN (any), TECHNICIAN (if assignee)
PATCH /api/assign         → ADMIN only
DELETE /api/tickets/{id}  → ADMIN only
```

**Status Transition Rules:**
```java
// Valid transitions:
OPEN → IN_PROGRESS       // on assignment
IN_PROGRESS → RESOLVED   // technician completion
RESOLVED → CLOSED        // admin finalization
OPEN → CLOSED            // admin direct close

// Invalid: IN_PROGRESS → OPEN, CLOSED → *, etc.
```

#### **SlaPolicy**

```java
public class SlaPolicy {
    // Static SLA hours per priority
    CRITICAL: 2 hours
    HIGH:     8 hours
    MEDIUM:   24 hours
    LOW:      72 hours

    // Called at ticket creation
    public LocalDateTime calculateSlaDeadline(Priority priority, LocalDateTime createdAt) {
        int hours = hoursFor(priority);
        return createdAt.plusHours(hours);
    }

    // Frontend uses this to show countdown timer
}
```

**Time Calculation:**
- Creation time + SLA hours = deadline
- Timer on frontend: deadline - current_time
- Breach: deadline < current_time AND status != CLOSED

#### **SlaEscalationJob**

```java
@Scheduled(fixedDelay = 30 * 60 * 1000)  // Every 30 minutes
public void escalateOpenLowPriorityTickets() {
    // Find: tickets where
    //   - status = OPEN
    //   - priority = LOW
    //   - created_at < 48 hours ago
    // Set: priority = MEDIUM, slaDeadline = recalculated
    // Event: admin notified
}
```

**Reasoning:**
- LOW tickets sit for 48h → indicates neglect
- Escalate to MEDIUM (24h SLA) to force attention
- No human intervention needed; automatic enforcement

#### **AttachmentService**

**Validation:**
```
✓ MIME type: jpeg, png, webp
✓ File size: ≤ 5MB
✓ Count: ≤ 3 per ticket
✗ Invalid type → 400 Bad Request
✗ Too large → 413 Payload Too Large
✗ Too many → 409 Conflict
```

**Upload Flow:**
1. Receive multipart file
2. Validate (type, size, count)
3. Generate UUID `storedName`
4. Upload to **Supabase Storage** at `ticket/{ticketId}/{storedName}.ext`
5. Save DB record with `originalName`, `storedName`, `fileUrl`
6. Return attachment metadata

**Why Supabase?**
- No local disk bloat on server
- CDN delivery (fast image download)
- Backup/redundancy
- No risk of server disk full

#### **CommentService**

**Create/Read:**
- Save with creator_id, content
- Return as list on ticket detail

**Edit:**
- Check: is requester the author? If no: 403 Forbidden
- Update content, modified_at

**Delete:**
- Check: is requester author OR admin? If no: 403 Forbidden
- Delete record

---

### REST Endpoints (Ticket & Comment)

#### **Ticket Endpoints**

| HTTP Method | Endpoint | Role | Returns |
|-------------|----------|------|---------|
| GET | `/api/tickets` | ADMIN, TECH | Array of tickets (filtered) |
| GET | `/api/tickets?status=OPEN&priority=HIGH` | ADMIN, TECH | Filtered array |
| GET | `/api/tickets/my` | Auth user | User's own tickets |
| GET | `/api/tickets/assigned` | TECH, ADMIN | Assigned to current user |
| GET | `/api/tickets/{id}` | Auth user | Single ticket + comments + attachments |
| GET | `/api/tickets/{id}/attachments/{storedName}` | Auth user | Download binary file |
| GET | `/api/tickets/analytics/technician-performance` | ADMIN | Performance metrics |
| GET | `/api/tickets/export?format=csv` | ADMIN | CSV download |
| POST | `/api/tickets` | USER only | Create (multipart: JSON + files) |
| PATCH | `/api/tickets/{id}/status` | ADMIN, TECH (if assignee) | Update status |
| PATCH | `/api/tickets/{id}/assign` | ADMIN | Assign technician |
| DELETE | `/api/tickets/{id}` | ADMIN | Remove ticket |

#### **Comment Endpoints**

| HTTP Method | Endpoint | Role | Returns |
|-------------|----------|------|---------|
| GET | `/api/tickets/{ticketId}/comments` | Auth user | Array of comments |
| POST | `/api/tickets/{ticketId}/comments` | Auth user | Create comment |
| PUT | `/api/tickets/{ticketId}/comments/{commentId}` | Author, ADMIN | Update comment |
| DELETE | `/api/tickets/{ticketId}/comments/{commentId}` | Author, ADMIN | Delete comment |

---

### Request/Response Examples

#### **Create Ticket (POST /api/tickets)**

**Request (multipart/form-data):**
```
POST /api/tickets

Headers:
  Authorization: Bearer <jwt>
  Content-Type: multipart/form-data

Body:
  ticket (JSON part):
  {
    "title": "Broken sink in Building A",
    "description": "Main bathroom sink is leaking",
    "category": "PLUMBING",
    "priority": "HIGH",
    "locationDescription": "3rd floor, north wing",
    "facilityId": 5
  }
  
  files (attachment part):
    photo1.jpeg (binary)
    photo2.png (binary)
```

**Response (201 Created):**
```json
{
  "id": 42,
  "title": "Broken sink in Building A",
  "status": "OPEN",
  "priority": "HIGH",
  "category": "PLUMBING",
  "slaDeadline": "2026-03-29T18:30:00Z",
  "attachments": [
    {
      "id": 101,
      "originalName": "photo1.jpeg",
      "storedName": "abc-123-def.jpeg",
      "mimeType": "image/jpeg",
      "fileUrl": "https://supabase.../ticket/42/abc-123-def.jpeg"
    }
  ]
}
```

#### **Update Ticket Status (PATCH /api/tickets/{id}/status)**

**Request:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Response (200 OK):**
```json
{
  "id": 42,
  "status": "IN_PROGRESS",
  "updatedAt": "2026-03-29T14:00:00Z"
}
```

---

## FRONTEND IMPLEMENTATION (React/Vite)

### Project Structure

```
frontend/src/
├── main.jsx
├── App.jsx
├── index.css
├── api/
│   ├── ticketApi.js                # Axios client for ticket endpoints
│   ├── authApi.js                  # Auth endpoints
│   ├── userAdminApi.js             # User management
│   ├── axiosInstance.js            # Axios config + interceptors
│   ├── authTokenMemory.js          # JWT storage in memory
│   ├── unauthorizedSession.js      # Session timeout handler
│   └── bookingApi.js               # (Other modules)
├── components/
│   ├── TicketCard.jsx              # Reusable ticket card display
│   ├── TicketStatusStepper.jsx     # Status workflow visualization
│   ├── TicketAttachmentImage.jsx   # Attachment display
│   ├── ImageUploadZone.jsx         # Drag-drop upload (react-dropzone)
│   ├── ImageLightbox.jsx           # Image gallery lightbox
│   ├── SlaTimer.jsx                # Countdown timer + breach warning
│   ├── CommentThread.jsx           # Comment list UI
│   ├── CommentInput.jsx            # Comment input form
│   ├── AssignTechnicianModal.jsx   # Technician selection
│   ├── StatusBadge.jsx             # Status display
│   ├── PriorityBadge.jsx           # Priority display
│   ├── DataTable.jsx               # Reusable table component
│   ├── dashboard/
│   │   ├── AdminTechnicianPanel.jsx
│   │   ├── DashboardCards.jsx      # Stat cards
│   │   └── DashboardPrimitives.jsx
│   └── notifications/              # Notification components
├── pages/
│   └── member3/
│       ├── MyTicketsPage.jsx       # User's own tickets
│       ├── CreateTicketPage.jsx    # Ticket creation form
│       ├── TicketDetailPage.jsx    # Full ticket view + comments
│       ├── AdminTicketsPage.jsx    # Admin dashboard / staff table
│       └── TechnicianDashboard.jsx # Technician view
├── utils/
│   └── ticketStatusDisplay.js      # Helper: `isResolvedLikeTicket()`, status labels
├── context/
│   └── AuthContext.jsx             # Global auth state
├── hooks/
│   ├── useTicketUpdates.js         # Polling for real-time updates
│   └── useNotifications.js         # Notification toast management
└── constants/
    └── technicianCategories.js     # Category definitions
```

### Pages Overview

#### **1. MyTicketsPage.jsx**

**Purpose:** List tickets created by the current user.

**Features:**
- Table/card view of own tickets
- Filters: status, category, priority, date range
- Sort: by created date, priority, status
- "Create Ticket" button
- Click to detail view

**Logic:**
```javascript
useEffect(() => {
  ticketApi.getMyTickets(filters).then(tickets => setTickets(tickets))
}, [filters])
```

#### **2. CreateTicketPage.jsx**

**Purpose:** Multi-step form to create a new ticket.

**Steps:**
1. **Basic Info** — title, description
2. **Details** — category, priority, location, facility link
3. **Attachments** — image upload zone (drag & drop)
4. **Review & Submit** — confirm all fields + submit

**Validation:**
- Title required, description optional
- Category/priority required
- Max 3 images, max 5MB each
- Form submission: multipart POST to `/api/tickets`

**API Call:**
```javascript
const formData = new FormData();
formData.append('ticket', JSON.stringify(ticketData));
files.forEach(file => formData.append('files', file));

axios.post('/api/tickets', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

#### **3. TicketDetailPage.jsx**

**Purpose:** Full ticket view with timeline, comments, attachments, SLA status.

**Sections:**
- **Header:** Title, status, priority, SLA timer
- **Metadata:** Created by, assigned to, category, facility
- **Status Stepper:** Visual workflow representation
- **Timeline:** Events (created, status changes, assignments)
- **Attachments Gallery:** Image cards with lightbox link
- **Comments Thread:** Full comment history + input form
- **Actions:** Status update, assign (admin), delete (admin)

**Real-time Updates:**
```javascript
// Poll every 5 seconds for updates
useTicketUpdates(ticketId, ticket => setTicket(ticket))
```

#### **4. AdminTicketsPage.jsx**

**Purpose:** Staff dashboard for managing all tickets.

**Sections:**
- **Filters:** status, category, priority, assignee, date range
- **Ticket Table:** all tickets with bulk checkboxes
- **Bulk Actions:** assign to technician, delete, resolve
- **Performance Table:** by technician (resolved, avg time, active)
- **Export:** CSV download

**Permissions:**
- Only ADMIN or TECHNICIAN role
- Non-staff redirected to MyTickets

#### **5. TechnicianDashboard.jsx**

**Purpose:** Technician's personal workload view.

**Sections:**
- **Live Assigned Tickets:** status, priority, SLA countdown
- **Performance Metrics:** cards showing resolved count, avg resolution time
- **Schedule Status Placeholder:** for future feature (on-call, off-duty, etc.)
- **Quick Actions:** click to detail, update status in-place

**Data Source:**
```javascript
// Fetch assigned tickets + performance
useEffect(() => {
  Promise.all([
    ticketApi.getAssignedTickets(),
    ticketApi.getTechnicianPerformance(technicianId)
  ]).then(data => setDashboard(data))
}, [])
```

### Key Components

#### **SlaTimer.jsx**

**Props:**
```javascript
<SlaTimer 
  deadline={ticket.slaDeadline}
  status={ticket.status}
  priority={ticket.priority}
/>
```

**Behavior:**
- Calculates remaining time: `deadline - now()`
- Shows **days:hours:minutes:seconds** countdown
- **Green:** ≥24h remaining
- **Yellow:** 4–24h remaining
- **Red:** <4h or breached
- **Gray:** Closed tickets (no timer)

**Breach Detection:**
```javascript
if (deadline < currentTime && status !== 'CLOSED') {
  return <SlaTimer className="breach" ... />
}
```

#### **ImageLightbox.jsx**

**Props:**
```javascript
<ImageLightbox 
  images={[{ url, alt }, ...]}
  initialIndex={0}
  onClose={handleClose}
/>
```

**Features:**
- Arrow keys / button navigation
- Close on ESC or X button
- Swipe support (mobile)
- Prev/next image cycling
- Image counter (e.g., "3 of 5")

#### **CommentThread.jsx**

**Props:**
```javascript
<CommentThread 
  comments={ticket.comments}
  ticketId={ticket.id}
  onCommentAdded={handleRefresh}
/>
```

**Child Component: CommentInput**
```javascript
<CommentInput 
  ticketId={ticketId}
  onSubmit={handleSubmitComment}
/>
```

**Edit/Delete Rules:**
- Only author can edit own comment
- Author **or** admin can delete
- Submit on Ctrl+Enter or button click
- Success toast notification

#### **ImageUploadZone.jsx**

**Props:**
```javascript
<ImageUploadZone 
  onFilesSelected={handleFiles}
  maxFiles={3}
  maxSize={5 * 1024 * 1024}  // 5MB
/>
```

**Features:**
- Drag & drop zone
- Click to browse files
- Preview thumbnails
- Remove individual files before submit
- MIME validation (jpeg, png, webp)
- Size warning if exceeded

#### **TicketCard.jsx**

**Props:**
```javascript
<TicketCard 
  ticket={ticket}
  onClick={handleViewDetail}
/>
```

**Displays:**
- Title, description truncated
- Priority badge, status badge
- SLA deadline, assignee name
- Thumbnail of first attachment (if any)

#### **Helper: ticketStatusDisplay.js**

```javascript
export const isResolvedLikeTicket = (ticket) => {
  // Backend stores resolve as CLOSED status
  // Frontend may need to show "resolved" for UX
  return ticket.status === 'CLOSED' || 
         ticket.resolutionMetadata?.resolvedAt
}

export const ticketStatusLabel = (status) => {
  // User-friendly labels (OPEN → "Open", IN_PROGRESS → "In Progress", etc.)
}

export const priorityColor = (priority) => {
  // Map priority to Tailwind color class
}
```

### API Client (ticketApi.js)

```javascript
import axiosInstance from './axiosInstance'

export const ticketApi = {
  // List & filter
  getTickets: (filters) => axiosInstance.get('/api/tickets', { params: filters }),
  getMyTickets: (filters) => axiosInstance.get('/api/tickets/my', { params: filters }),
  getAssignedTickets: () => axiosInstance.get('/api/tickets/assigned'),

  // CRUD
  getTicket: (id) => axiosInstance.get(`/api/tickets/${id}`),
  createTicket: (formData) => axiosInstance.post('/api/tickets', formData),
  updateStatus: (id, status) => axiosInstance.patch(`/api/tickets/${id}/status`, { status }),
  assignTechnician: (id, userId) => axiosInstance.patch(`/api/tickets/${id}/assign`, { userId }),
  deleteTicket: (id) => axiosInstance.delete(`/api/tickets/${id}`),

  // Attachments
  downloadAttachment: (ticketId, storedName) => 
    axiosInstance.get(`/api/tickets/${ticketId}/attachments/${storedName}`, 
      { responseType: 'blob' }),

  // Comments
  getComments: (ticketId) => axiosInstance.get(`/api/tickets/${ticketId}/comments`),
  addComment: (ticketId, content) => 
    axiosInstance.post(`/api/tickets/${ticketId}/comments`, { content }),
  updateComment: (ticketId, commentId, content) => 
    axiosInstance.put(`/api/tickets/${ticketId}/comments/${commentId}`, { content }),
  deleteComment: (ticketId, commentId) => 
    axiosInstance.delete(`/api/tickets/${ticketId}/comments/${commentId}`),

  // Analytics
  getTechnicianPerformance: () => axiosInstance.get('/api/tickets/analytics/technician-performance'),

  // Export
  exportCsv: () => axiosInstance.get('/api/tickets/export', { responseType: 'blob' })
}
```

---

## KEY FEATURES EXPLAINED

### 1. Multi-Step Ticket Creation

**User Journey:**
1. User clicks "Create Ticket"
2. **Step 1:** Enter title & description
3. **Step 2:** Select category, priority, location
4. **Step 3:** Drag-drop images (max 3, 5MB each)
5. **Step 4:** Review & submit

**Backend Processing:**
- Receive multipart: JSON `ticket` part + binary `files` parts
- Validate ticket data (required fields, enums)
- Validate attachments (MIME type, size, count)
- Upload files to **Supabase Storage**
- Save ticket to DB with attachment records
- Return full ticket response

**Why Multipart?**
- Single HTTP call (not separate file upload)
- Atomic operation (all or nothing)
- Simpler client logic

### 2. Status Workflow Validation

**Rules Encoded in Backend:**

```java
private void validateStatusTransition(TicketStatus from, TicketStatus to) {
  if (from == OPEN && to == IN_PROGRESS) return;      // ✓ Assign
  if (from == IN_PROGRESS && to == RESOLVED) return;  // ✓ Complete
  if (from == RESOLVED && to == CLOSED) return;       // ✓ Finalize
  if (from == OPEN && to == CLOSED) return;           // ✓ Admin close
  throw new InvalidStatusTransitionException(...);    // ✗ Invalid move
}
```

**Frontend UI:**
- `TicketStatusStepper` shows all possible states
- Buttons only enabled for valid next states
- Technician can't see "Assign" button (admin-only)

### 3. SLA Management

**Creation Time (automatic):**
```java
LocalDateTime deadline = LocalDateTime.now().plusHours(
  slaPolicy.hoursFor(priority)  // 2h for CRITICAL, 8h for HIGH, etc.
);
```

**Escalation Job (scheduled):**
```java
// Every 30 minutes
@Scheduled(fixedDelay = 1800000)  // 30 min in ms
public void escalate() {
  // Find tickets: OPEN, LOW priority, >48h old
  // Set to MEDIUM priority, recalc SLA deadline
}
```

**Frontend Display:**
- Countdown timer on ticket detail
- Color-coded warning (green → yellow → red)
- "SLA Breached" badge if deadline passed

### 4. Role-Based Access Control (RBAC)

**AuthZ Rules:**

| Resource | USER | TECHNICIAN | ADMIN |
|----------|------|-----------|-------|
| Create ticket | ✓ | ✗ | ✗ |
| View own tickets | ✓ | ✓ | ✓ |
| View all tickets | ✗ | ✓ | ✓ |
| View assigned tickets | ✗ | ✓ | ✓ |
| Update own ticket status | ✗ | ✓ (if assigned) | ✓ |
| Assign technician | ✗ | ✗ | ✓ |
| Export CSV | ✗ | ✗ | ✓ |
| Delete ticket | ✗ | ✗ | ✓ |

**Enforcement Points:**
- Backend: `SecurityConfig` route rules + `@PreAuthorize` annotations
- Frontend: Role checks before render (redirect if unauthorized)

### 5. Image Attachments & Lightbox

**Constraints:**
- **Max 3 files per ticket**
- **Max 5MB each**
- **MIME types:** JPEG, PNG, WebP
- **Storage:** Supabase (not local disk)

**Upload Validation Chain:**
```
1. Check MIME type (server-side + client-side)
2. Check file size (server-side + client-side)
3. Check count (after upload, before save)
4. If invalid: return 400 with specific error
5. If valid: upload to Supabase, save DB record
```

**Lightbox Features:**
- Click thumbnail → open full-screen gallery
- Arrow keys or buttons to navigate
- Click outside or ESC to close
- Mobile swipe support

### 6. Real-Time Ticket Updates

**Polling Strategy:**
```javascript
const useTicketUpdates = (ticketId, onUpdate) => {
  useEffect(() => {
    const interval = setInterval(() => {
      ticketApi.getTicket(ticketId)
        .then(ticket => onUpdate(ticket))
    }, 5000)  // Every 5 seconds
    return () => clearInterval(interval)
  }, [ticketId, onUpdate])
}
```

**Why Polling (not WebSocket)?**
- Simpler infrastructure (no server push needed)
- No real-time expectation (5-sec latency acceptable)
- Lower cost on backend (no persistent connections)
- Easier testing

### 7. CSV Export

**Admin Feature:** Export all tickets to spreadsheet.

**Included Columns:**
- ID, Title, Status, Priority, Category
- Created Date, Assigned To, SLA Deadline
- Resolved Date, Comments Count, Attachments Count

**Implementation:**
```java
// Backend: Apache Commons CSV library
// Generate CSV byte stream
// Return with Content-Type: text/csv + Content-Disposition: attachment

// Frontend: download blob
axios.get('/api/tickets/export', { responseType: 'blob' })
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets.csv';
    a.click();
  })
```

---

## API ENDPOINTS REFERENCE

### Base URL
```
http://localhost:8081/api  (development)
/api  (production)
```

### Ticket Management

#### List All Tickets (Admin/Technician)
```
GET /api/tickets?status=OPEN&priority=HIGH&limit=20&offset=0

Query Params:
  status: OPEN | IN_PROGRESS | RESOLVED | CLOSED
  priority: LOW | MEDIUM | HIGH | CRITICAL
  category: PLUMBING | ELECTRICAL | CLEANING | HVAC | LANDSCAPING | OTHER
  assigneeId: <user_id>
  limit: <number>
  offset: <number>

Response: 200 OK
[
  {
    "id": 1,
    "title": "...",
    "status": "OPEN",
    "priority": "HIGH",
    "slaDeadline": "2026-03-29T18:00:00Z",
    "attachments": [...],
    "comments": [...]
  }
]
```

#### Get My Tickets (User)
```
GET /api/tickets/my?status=OPEN

Response: 200 OK
[ { ticket objects } ]
```

#### Get Assigned Tickets (Technician/Admin)
```
GET /api/tickets/assigned

Response: 200 OK
[ { ticket objects assigned to current user } ]
```

#### Get Single Ticket Detail
```
GET /api/tickets/{id}

Response: 200 OK
{
  "id": 1,
  "title": "Broken sink",
  "description": "Main bathroom",
  "status": "OPEN",
  "priority": "HIGH",
  "category": "PLUMBING",
  "createdBy": { "id": 5, "name": "John", ... },
  "assignedTo": { "id": 12, "name": "Tech1", ... },
  "slaDeadline": "2026-03-29T18:00:00Z",
  "attachments": [
    {
      "id": 101,
      "originalName": "photo.jpg",
      "storedName": "uuid-123.jpg",
      "fileUrl": "https://supabase.../ticket/1/uuid-123.jpg"
    }
  ],
  "comments": [
    {
      "id": 201,
      "createdBy": { "name": "Tech1" },
      "content": "...",
      "createdAt": "2026-03-29T10:00:00Z"
    }
  ]
}

Errors:
  404 Not Found — ticket doesn't exist
  403 Forbidden — user not authorized to view this ticket
```

#### Create Ticket (Multipart)
```
POST /api/tickets
Content-Type: multipart/form-data

Body:
  ticket (JSON part):
  {
    "title": "Broken door handle",
    "description": "East wing, 2nd floor",
    "category": "OTHER",
    "priority": "MEDIUM",
    "locationDescription": "Building A, 2nd floor",
    "facilityId": 3
  }

  files:
    file1.jpg (binary)
    file2.png (binary)

Response: 201 Created
{
  "id": 42,
  "title": "...",
  "status": "OPEN",
  "attachments": [ {...}, {...} ],
  ...
}

Errors:
  400 Bad Request — invalid data
  413 Payload Too Large — file too big
  409 Conflict — >3 files
```

#### Update Status
```
PATCH /api/tickets/{id}/status

Body:
{
  "status": "IN_PROGRESS"
}

Response: 200 OK
{
  "id": 42,
  "status": "IN_PROGRESS",
  "updatedAt": "2026-03-29T14:00:00Z"
}

Errors:
  400 Bad Request — invalid status
  409 Conflict — invalid transition
  403 Forbidden — not authorized
```

#### Assign Technician (Admin Only)
```
PATCH /api/tickets/{id}/assign

Body:
{
  "technicianId": 12
}

Response: 200 OK
{
  "id": 42,
  "assignedTo": { "id": 12, "name": "Tech1" },
  "status": "IN_PROGRESS"  // Auto-transitioned from OPEN
}
```

#### Delete Ticket (Admin Only)
```
DELETE /api/tickets/{id}

Response: 204 No Content

Errors:
  403 Forbidden — not admin
  404 Not Found — ticket doesn't exist
```

#### Download Attachment
```
GET /api/tickets/{ticketId}/attachments/{storedName}

Response: 200 OK (binary file)
Content-Type: image/jpeg (or image/png, image/webp)
Content-Disposition: attachment; filename="original.jpg"

Errors:
  404 Not Found — attachment doesn't exist
```

#### Export Tickets to CSV (Admin Only)
```
GET /api/tickets/export?status=CLOSED&limit=500

Query Params:
  status (optional): filter tickets
  priority (optional): filter by priority
  limit (optional): max rows

Response: 200 OK (CSV file)
Content-Type: text/csv
Content-Disposition: attachment; filename="tickets.csv"

CSV Columns:
  ID, Title, Status, Priority, Category, Created Date,
  Assigned To, SLA Deadline, Resolved Date, Comments Count, Attachments
```

### Comments

#### List Comments
```
GET /api/tickets/{ticketId}/comments

Response: 200 OK
[
  {
    "id": 201,
    "content": "I'll look into this",
    "createdBy": { "id": 12, "name": "Tech1" },
    "createdAt": "2026-03-29T10:00:00Z",
    "updatedAt": "2026-03-29T10:00:00Z"
  }
]
```

#### Create Comment
```
POST /api/tickets/{ticketId}/comments

Body:
{
  "content": "Checked the sink, needs part replacement"
}

Response: 201 Created
{ "id": 202, "content": "...", "createdBy": {...}, ... }
```

#### Edit Comment (Author/Admin Only)
```
PUT /api/tickets/{ticketId}/comments/{commentId}

Body:
{
  "content": "Updated comment text"
}

Response: 200 OK
{ "id": 202, "content": "Updated comment text", ... }

Errors:
  403 Forbidden — not author or admin
```

#### Delete Comment (Author/Admin Only)
```
DELETE /api/tickets/{ticketId}/comments/{commentId}

Response: 204 No Content

Errors:
  403 Forbidden — not author or admin
```

### Analytics

#### Get Technician Performance (Admin Only)
```
GET /api/tickets/analytics/technician-performance

Response: 200 OK
[
  {
    "technicianId": 12,
    "name": "Tech1",
    "ticketsResolved": 45,
    "averageResolutionTime": 2.5,  // days
    "activeTickets": 3,
    "performanceScore": 95
  }
]
```

---

## TESTING STRATEGY

### Backend Tests

#### **Unit Tests** (Service Layer)

**File:** `backend/src/test/java/com/smartcampus/maintenance/service/TicketServiceTest.java`

**Coverage:**
- `testCreateTicket()` — valid creation
- `testStatusTransitionValidation()` — valid/invalid transitions
- `testSlaDeadlineCalculation()` — SLA policy application
- `testAssignTicket()` — auto-transition OPEN → IN_PROGRESS
- `testAccessControl()` — role-based visibility

**Example:**
```java
@Test
public void testStatusTransitionValidation() {
  Ticket ticket = new Ticket();
  ticket.setStatus(TicketStatus.IN_PROGRESS);
  
  assertThrows(InvalidStatusTransitionException.class, 
    () -> ticketService.updateStatus(ticket, TicketStatus.OPEN));
}
```

#### **Attachment Service Tests**

**File:** `backend/src/test/java/com/smartcampus/maintenance/service/AttachmentServiceTest.java`

**Coverage:**
- `testFileSizeValidation()` — ≤5MB
- `testMimeTypeValidation()` — only jpeg, png, webp
- `testMaxFileCount()` — ≤3 files per ticket

**Example:**
```java
@Test
public void testMimeTypeValidation() {
  File invalidFile = new File("test.exe");
  assertThrows(InvalidFileTypeException.class,
    () -> attachmentService.validateAttachment(invalidFile));
}
```

#### **Comment Service Tests**

**File:** `backend/src/test/java/com/smartcampus/maintenance/service/CommentServiceTest.java`

**Coverage:**
- `testCreateComment()` — save with creator
- `testEditCommentAuthz()` — author only, or admin
- `testDeleteCommentAuthz()` — author or admin

#### **Integration Tests** (Controller Layer)

**File:** `backend/src/test/java/com/smartcampus/maintenance/controller/TicketControllerIntegrationTest.java`

**Coverage:**
- `testCreateTicketMultipart()` — end-to-end creation
- `testListTicketsFiltered()` — filter params
- `testExportCsv()` — file download
- `testAccessControl()` — 403/401 responses

**Setup:**
- `@SpringBootTest` annotation
- Test database (PostgreSQL required, or H2 in-memory)
- Mock authentication via `@WithMockUser`

**Example:**
```java
@Test
@WithMockUser(roles = "ADMIN")
public void testExportCsv() throws Exception {
  mockMvc.perform(get("/api/tickets/export"))
    .andExpect(status().isOk())
    .andExpect(content().contentType(MediaType.TEXT_PLAIN));
}
```

### Frontend Tests

#### **Component Tests** (Vitest)

**File:** `frontend/src/components/SlaTimer.test.jsx`

**Coverage:**
- Render timer with deadline
- Calculate remaining time
- Color coding based on time remaining
- Breached state

**Example:**
```javascript
import { render, screen } from '@testing-library/react'
import SlaTimer from './SlaTimer'

test('displays countdown timer', () => {
  const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000)
  render(<SlaTimer deadline={deadline} status="OPEN" />)
  expect(screen.getByText(/\d+:\d+:\d+/)).toBeInTheDocument()
})
```

**File:** `frontend/src/components/ImageLightbox.test.jsx`

**Coverage:**
- Next/prev navigation
- Close on ESC / X button
- Image counter
- Array bounds

#### **Run Tests**

**Backend:**
```bash
cd backend
./mvnw test              # All tests
./mvnw test -Dtest=TicketServiceTest  # Specific class
```

**Frontend:**
```bash
cd frontend
npm run test             # Watch mode
npm run test:ui         # UI viewer
```

---

## INNOVATION FEATURES

### 1. **SLA Timer with Visual Breach Warning**

**What's Innovative:**
- Real-time countdown timer on ticket detail
- Color-coded urgency (green → yellow → red)
- Automatic escalation job (no manual intervention)
- Breach detection prevents SLA violations

**Technical Insight:**
```javascript
// Calculate % of SLA elapsed
const percentElapsed = (deadline - now) / (deadline - created) * 100
// Color based on threshold
if (percentElapsed > 75) return 'red'
if (percentElapsed > 50) return 'yellow'
return 'green'
```

### 2. **Scheduled Priority Escalation Job**

**What's Innovative:**
- **Automatic** escalation: LOW → MEDIUM after 48h if OPEN
- Runs every 30 minutes (no user action needed)
- Forces attention to neglected tickets
- Reduces support backlog

**Use Case:**
- Day 1: User reports low-priority cosmetic issue
- Day 2: Still OPEN → scheduler escalates to MEDIUM
- Admin gets alert → forces triage/assignment

**Configuration:**
```java
@Scheduled(fixedDelay = 1800000)  // 30 min
public void escalateOpenLowPriorityTickets() {
  List<Ticket> neglected = ticketRepository.find(
    status='OPEN', priority='LOW', 
    createdBefore(48 hours ago)
  );
  neglected.forEach(t -> {
    t.setPriority(Priority.MEDIUM);
    t.setSlaDeadline(recalculate());  // 24h from now
    t.setEscalatedAt(now());
  });
}
```

### 3. **Technician Performance Metrics**

**What's Innovative:**
- Dashboard shows technician workload & efficiency
- Metrics: resolved tickets, avg resolution time, active tickets
- Admin can optimize technician load balancing
- Performance incentivization (data-driven)

**Metrics Calculated:**
```sql
SELECT 
  u.id, u.name,
  COUNT(CASE WHEN t.status='CLOSED') as resolved_count,
  AVG(DATEDIFF(t.closed_at, t.created_at)) as avg_resolution_days,
  COUNT(CASE WHEN t.status IN ('OPEN','IN_PROGRESS')) as active_tickets
FROM user u
LEFT JOIN ticket t ON t.assigned_to_id = u.id
WHERE u.role = 'TECHNICIAN'
GROUP BY u.id
```

**Display:**
- Performance cards on technician dashboard
- Charts on admin panel (optional future)
- Sortable table: by resolved, avg time, active tickets

### 4. **Image Lightbox for Ticket Attachments**

**What's Innovative:**
- Full-screen image gallery viewing
- Keyboard navigation (arrows, ESC)
- Mobile swipe support
- Prevents context loss (no new browser tab)
- Professional UX for damage documentation

**User Flow:**
1. Click ticket attachment thumbnail
2. Lightbox opens in modal
3. User navigates with arrows or swipe
4. Close with ESC or X button
5. Returns to ticket detail

### 5. **CSV Export for Reporting**

**What's Innovative:**
- Admin can export ticket queue to Excel
- Filterable: by status, priority, date range
- Includes: ID, title, priority, SLA deadline, assignee, resolution time
- Data analysis & reporting (external BI tools)
- Audit trail compliance

**Export Columns:**
```
ID | Title | Status | Priority | Category | Created | 
Assigned To | SLA Deadline | Resolved | Closed |
Comment Count | Attachment Count
```

**Use Case:**
- Monthly report: how many tickets resolved?
- Trend analysis: is backlog growing?
- Technician comparison: who's most productive?

---

## RUNNING & VERIFICATION

### Prerequisites

- **Java:** JDK 11+ (11, 17, or 21 supported)
- **Node.js:** 16+
- **PostgreSQL:** 12+ (for database)
- **Maven:** 3.8+ (for build)

### 1. Backend Setup

#### A. Clone & Install Dependencies

```bash
cd backend
./mvnw clean install        # Windows: mvnw.cmd clean install
```

#### B. Configure Database

**Create `.env` file** in `backend/` directory:
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/smart_campus
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
SPRING_JPA_HIBERNATE_DDL_AUTO=update

# Supabase (for file uploads)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_BUCKET=smart-campus-uploads

# JWT
JWT_SECRET=your-secret-key-at-least-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
```

#### C. Start Backend

```bash
./mvnw spring-boot:run
# or
java -jar target/maintenance-1.0.0.jar
```

**Server runs at:** `http://localhost:8081`

**Verify:**
- Health check: `curl http://localhost:8081/actuator/health`
- Swagger UI: `http://localhost:8081/swagger-ui.html`

### 2. Frontend Setup

#### A. Install Dependencies

```bash
cd frontend
npm install
```

#### B. Configure Environment

**Create `.env.local` file:**
```env
VITE_API_BASE_URL=http://localhost:8081
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### C. Start Dev Server

```bash
npm run dev
```

**Frontend runs at:** `http://localhost:5173`

### 3. Verify Application

#### A. Backend Tests

```bash
cd backend
./mvnw test                                    # All tests
./mvnw test -Dtest=TicketServiceTest         # Specific
```

#### B. Frontend Tests

```bash
cd frontend
npm run test                                   # Watch mode
npm run test:ui                               # UI viewer
```

#### C. Manual Testing Checklist

- [ ] Login with Google or email/password
- [ ] Create ticket (with image attachments)
- [ ] View own tickets list
- [ ] View ticket detail (SLA timer, comments, attachments)
- [ ] Click attachment → lightbox opens
- [ ] Add comment → appears in thread
- [ ] (Admin) View all tickets
- [ ] (Admin) Assign technician → status auto-transitions
- [ ] (Admin) Export CSV → file downloads
- [ ] (Tech) View assigned tickets
- [ ] (Tech) Update status → reflected in detail view

#### D. Database Verification

```sql
-- Connect to PostgreSQL
psql -U postgres -d smart_campus

-- Check tables
\dt
-- Check sample ticket
SELECT * FROM ticket LIMIT 1;
-- Check comments
SELECT * FROM comment LIMIT 1;
```

---

## VIVA Q&A PREPARATION

### Q1: **What's the overall scope of your module?**

**Answer:**
The **Maintenance & Incident Ticketing Module** enables campus users to report facility issues (broken sinks, electrical problems, etc.) and tracks their resolution through a workflow managed by technicians and admins. I implemented both the **backend REST API** (Spring Boot) and **frontend UI** (React), covering ticket creation, assignment, status tracking, SLA management, comments, image attachments, and admin analytics.

---

### Q2: **Describe the ticket status workflow.**

**Answer:**
Tickets follow this workflow:
1. **OPEN** — User creates ticket (initial state)
2. **IN_PROGRESS** — Admin assigns technician; status auto-transitions
3. **RESOLVED** — Technician marks as complete (issue fixed)
4. **CLOSED** — Admin finalizes ticket (archived)

Invalid transitions are rejected (e.g., can't go from CLOSED back to OPEN). The backend validates all transitions in the service layer.

---

### Q3: **How is the SLA (Service Level Agreement) implemented?**

**Answer:**
At ticket creation, we calculate a deadline based on priority:
- **CRITICAL:** 2 hours
- **HIGH:** 8 hours
- **MEDIUM:** 24 hours
- **LOW:** 72 hours

The deadline = creation time + SLA hours.

On the frontend, `SlaTimer` component shows a countdown. If deadline passes and ticket is still OPEN, it displays a "breached" warning in red.

Additionally, a scheduled job (`SlaEscalationJob`) runs every 30 minutes and **automatically escalates LOW-priority tickets from 48+ hours old to MEDIUM**, forcing attention to neglected tickets.

---

### Q4: **Why do you store files in Supabase instead of local disk?**

**Answer:**
**Supabase Storage** (S3-compatible cloud) provides several benefits:
1. **Scalability** — no server disk limits
2. **CDN delivery** — faster image downloads
3. **Reliability** — automatic backup & redundancy
4. **Cost-effective** — pay-per-use model
5. **Security** — encrypted storage, access control

Each file is stored with a UUID `storedName` (not the original) and we keep database records linking original name, MIME type, and Supabase URL.

---

### Q5: **Describe the image attachment feature.**

**Answer:**
Users can attach up to **3 images** (max 5MB each) when creating a ticket. We validate:
- **MIME type:** only JPEG, PNG, WebP (no executables)
- **File size:** max 5MB per file
- **Count:** max 3 files per ticket

On the detail page, attachments display as a gallery. Clicking an image opens a **lightbox component** for full-screen viewing with arrow navigation, ESC to close, and mobile swipe support.

This helps technicians visually inspect damage before visiting the site.

---

### Q6: **How does the permission system work?**

**Answer:**
Three roles with different permissions:
- **USER:** Create tickets, view own tickets only
- **TECHNICIAN:** View assigned tickets, update status, add comments, see performance metrics
- **ADMIN:** Full access (view all tickets, assign, delete, export, manage users)

Enforcement happens at two levels:
1. **Backend:** Route rules in `SecurityConfig` + `@PreAuthorize` annotations on service methods
2. **Frontend:** Role checks before rendering (redirect if unauthorized)

For example, the "Export CSV" button only renders if `role === 'ADMIN'`, and the backend rejects the request if someone tries to access it without that role.

---

### Q7: **Explain the comment feature.**

**Answer:**
Comments enable collaboration between users, technicians, and admins on a ticket. Each comment has:
- **creator** (who wrote it)
- **content** (text)
- **timestamps** (created_at, updated_at)

**Permissions:**
- Any authenticated user can add a comment
- Only the **author** can edit their own comment (403 Forbidden otherwise)
- Only the **author or admin** can delete a comment

This prevents admins from editing user reports (maintaining integrity) but allows them to remove spam/inappropriate comments.

---

### Q8: **What tests did you write?**

**Answer:**
**Backend:**
- **Service tests:** `TicketServiceTest`, `CommentServiceTest`, `AttachmentServiceTest`
  - Test SLA calculation, status transitions, access control, file validation
- **Integration tests:** `TicketControllerIntegrationTest`, `CommentControllerIntegrationTest`
  - Test multipart requests, filters, CSV export, auth enforcement

**Frontend:**
- **Component tests:** `SlaTimer.test.jsx`, `ImageLightbox.test.jsx` (Vitest)
  - Test timer countdown, breach detection, lightbox navigation

All tests use mocked dependencies and are CI/CD-ready.

---

### Q9: **How does the technician dashboard show performance metrics?**

**Answer:**
The dashboard queries the backend endpoint `/api/tickets/analytics/technician-performance`, which calculates for each technician:
- **Tickets resolved:** COUNT of closed tickets assigned to them
- **Avg resolution time:** AVERAGE(closed_at - created_at)
- **Active tickets:** COUNT of tickets still OPEN or IN_PROGRESS

The frontend displays these as **metric cards** with numbers and trends. Admins can use this data to identify high-performing technicians or workload imbalances.

---

### Q10: **What's an innovation feature you implemented?**

**Answer:**
**Automatic Priority Escalation Job** — I implemented a Spring `@Scheduled` task that runs every 30 minutes and automatically escalates LOW-priority tickets that have been OPEN for >48 hours to MEDIUM priority. This ensures no ticket is forgotten indefinitely. The SLA deadline is recalculated (now 24h instead of 72h), forcing the admin to prioritize it.

This is innovative because it's **autonomous** (no human action needed) and **data-driven** (48h threshold based on support best practices). It balances resource constraints with fairness.

---

### Q11: **How does multipart file upload work in your API?**

**Answer:**
When creating a ticket with attachments, the frontend sends **multipart/form-data** with:
1. **JSON part** (name: `ticket`) — ticket metadata
2. **File parts** (name: `files`) — binary file data

The backend receives this in `TicketController.createTicket()` using `@RequestPart` annotations:
```java
@PostMapping("/api/tickets")
public ResponseEntity<TicketResponse> createTicket(
  @RequestPart("ticket") TicketRequest ticketRequest,
  @RequestPart("files") List<MultipartFile> files
) { ... }
```

We validate, then upload to Supabase. This ensures all data arrives in one atomic HTTP call (all or nothing).

---

### Q12: **Describe the real-time update mechanism.**

**Answer:**
The ticket detail page uses a **polling strategy**:
```javascript
useTicketUpdates(ticketId, ticket => setTicket(ticket))
```

This hook fetches the ticket every **5 seconds** and updates the UI if data changed. While not true real-time, 5-second latency is acceptable for a ticketing system and is much simpler than WebSockets.

Advantages:
- Simple infrastructure (no server push)
- Lower backend load
- Easier testing & debugging

---

### Q13: **What would you improve if given more time?**

**Answer:**
1. **WebSocket real-time updates** — reduce polling latency to instant
2. **Notifications** — email/SMS alerts when ticket status changes
3. **Technician schedule** — on-call tracking, shift management
4. **Ticket templates** — reduce creation time for common issues
5. **Analytics dashboard** — charts showing trends, bottlenecks
6. **Full-text search** — search across all ticket fields
7. **File compression** — auto-resize large images before upload
8. **Audit log** — track all changes for compliance

---

### Q14: **How do you handle database errors gracefully?**

**Answer:**
We have multiple layers:

1. **Service layer** — try-catch, custom exceptions (e.g., `TicketNotFoundException`)
2. **Controller layer** — `@ExceptionHandler` annotations that map exceptions to HTTP responses (404, 403, 400, etc.)
3. **Global exception handler** — standardized error response format with timestamp, status, message, path, field details
4. **Frontend** — Axios interceptors catch errors, display toast notifications to users

Example:
```java
@ExceptionHandler(TicketNotFoundException.class)
public ResponseEntity<ErrorResponse> handleNotFound(...) {
  return ResponseEntity.status(404).body(new ErrorResponse(...));
}
```

---

### Q15: **Explain your choice of React/Vite over other frontend frameworks.**

**Answer:**
- **React** — industry-standard, large ecosystem, component-based (reusable TicketCard, SlaTimer, etc.)
- **Vite** — modern bundler, fast hot-reload (great DX), built-in support for CSS-in-JS, smaller bundle
- **Tailwind CSS** — utility-first, reduces CSS bloat, consistent design system

The combination is ideal for rapid iteration and maintainability. Hooks like `useTicketUpdates` and `useNotifications` abstract complex logic into reusable logic, making components clean.

---

## RELATED DOCUMENTATION

| Document | Purpose | Location |
|----------|---------|----------|
| **MEMBER3_IMPLEMENTATION_CHECKLIST.md** | File-by-file status | Root |
| **MEMBER3_DETAILED_RECOMMENDATIONS.md** | Original audit (archived) | Root |
| **API_DOCUMENTATION.md** | REST endpoint reference | `backend/` |
| **AUTHENTICATION.md** | JWT & OAuth flow | `backend/` |
| **README.md** | Project overview & setup | Root |
| **DEPLOYMENT.md** | Production deployment guide | Root |
| **TROUBLESHOOTING.md** | Common issues & fixes | Root |

---

## FINAL CHECKLIST BEFORE VIVA

- [ ] **Read all three MEMBER3_*.md files** (this guide, checklist, recommendations)
- [ ] **Understand the architecture diagram** (frontend → backend → database → Supabase)
- [ ] **Know the database schema** (Ticket, Comment, Attachment tables)
- [ ] **Be familiar with all API endpoints** (create, list, filter, assign, export, comments)
- [ ] **Know the file structure** (both backend Java packages and frontend React components)
- [ ] **Prepare 2-3 examples** for common features (e.g., "To create a ticket, user fills form → multipart POST → backend validates → uploads to Supabase → returns response")
- [ ] **Understand tests** (what's covered, how to run)
- [ ] **Know permission rules** (USER vs TECHNICIAN vs ADMIN)
- [ ] **Able to explain innovation** (SLA escalation, lightbox, performance metrics, CSV export)
- [ ] **Can run the application locally** (backend on 8081, frontend on 5173)
- [ ] **Know common Q&A answers** (above section)

---

## CLOSING REMARKS

You built a **complete, production-ready ticketing system** with proper architecture, comprehensive testing, role-based security, and innovative features like SLA escalation and performance metrics.

**Key Achievements:**
- ✅ Backend API fully implemented & documented
- ✅ Frontend UI polished & responsive
- ✅ Role-based access control enforced
- ✅ Database schema normalized
- ✅ File storage cloud-based (Supabase)
- ✅ Unit & integration tests written
- ✅ Innovation features (escalation, metrics, lightbox, CSV)
- ✅ API fully integrated with frontend

**Good luck with your viva!** 🎓

---

**Document Version:** 1.0 (Viva Preparation)  
**Date:** March 29, 2026  
**Status:** Ready for Presentation
