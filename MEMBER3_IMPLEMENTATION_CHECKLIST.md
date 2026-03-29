# MEMBER 3 — Implementation Checklist (Maintenance & Incident Ticketing)

**Last updated:** March 29, 2026  
**Status:** **Complete**

---

## 1. Backend — `com.smartcampus.maintenance`

### 1.1 Package layout

```
backend/src/main/java/com/smartcampus/maintenance/
├── MaintenanceApplication.java          # @SpringBootApplication, scheduling
├── config/
│   ├── SecurityConfig.java              # CORS, JWT filter chain, route rules
│   └── DevAuthFilter.java               # Dev convenience (if enabled)
├── controller/
│   ├── TicketController.java            # /api/tickets/*
│   ├── CommentController.java           # /api/tickets/{id}/comments/*
│   └── RootController.java
├── dto/                                 # TicketRequest/Response, Comment, Status update, Attachment, TechnicianPerformance
├── event/
│   ├── TicketStatusChangedEvent.java
│   └── NewCommentEvent.java
├── model/
│   ├── Ticket.java, Comment.java, Attachment.java
│   └── enums/ TicketStatus, Priority, TicketCategory
├── policy/
│   └── SlaPolicy.java                   # hoursFor(), calculateSlaDeadline()
├── repository/
│   ├── TicketRepository.java
│   ├── CommentRepository.java
│   └── AttachmentRepository.java
├── scheduler/
│   └── SlaEscalationJob.java            # @Scheduled: LOW → MEDIUM if open > 48h
└── service/
    ├── TicketService.java / TicketServiceImpl.java
    ├── CommentService.java / CommentServiceImpl.java
    ├── AttachmentService.java
    └── SupabaseStorageService.java
```

### 1.2 Ticket API (high level)

| Method | Path | Role / notes |
|--------|------|----------------|
| GET | `/api/tickets` | ADMIN, TECHNICIAN — filters |
| GET | `/api/tickets/my` | Authenticated — reporter’s tickets |
| GET | `/api/tickets/assigned` | TECHNICIAN, ADMIN — assigned to current user |
| GET | `/api/tickets/{id}` | Authenticated — access rules in service |
| POST | `/api/tickets` | **Not** ADMIN/TECHNICIAN — multipart + JSON part |
| PATCH | `/api/tickets/{id}/status` | ADMIN, TECHNICIAN (assignee rules) |
| PATCH | `/api/tickets/{id}/assign` | ADMIN |
| DELETE | `/api/tickets/{id}` | ADMIN |
| GET | `/api/tickets/{id}/attachments/{storedName}` | Authenticated — download |
| GET | `/api/tickets/analytics/technician-performance` | ADMIN |
| GET | `/api/tickets/export` | ADMIN — CSV (Apache Commons CSV) |

### 1.3 Comments API

| Method | Path |
|--------|------|
| GET/POST | `/api/tickets/{ticketId}/comments` |
| PUT/DELETE | `/api/tickets/{ticketId}/comments/{commentId}` |

**Rules:** Edit = author only (403 otherwise). Delete = author **or** admin.

### 1.4 Attachments

- Max **3** files; MIME **jpeg, png, webp**; **5MB** each (`AttachmentService`).
- Storage: **Supabase** (not local `uploads/…` folder).
- DB: `originalName`, `storedName` (UUID), `mimeType`, `size`, `ticket`, optional `fileUrl`.

### 1.5 SLA & escalation

- **SlaPolicy:** CRITICAL 2h, HIGH 8h, MEDIUM 24h, LOW 72h (aligned with frontend `SlaTimer`).
- **SlaEscalationJob:** every **30 minutes**; escalates **LOW → MEDIUM** when still **OPEN** and created before **48h** ago (updates `slaDeadline`).

### 1.6 Related packages (not Member 3–only but integrated)

- `com.smartcampus.auth` — JWT, `UserPrincipal`, `Authz` helpers.
- `com.smartcampus.user` — users, roles, technician admin endpoints.
- `com.smartcampus.facilities` — optional `facilityId` on tickets.

---

## 2. Frontend — Member 3

### 2.1 Pages (`frontend/src/pages/member3/`)

| File | Purpose |
|------|---------|
| `MyTicketsPage.jsx` | User tickets, filters, sort, create button |
| `CreateTicketPage.jsx` | Multi-step form, `ImageUploadZone`, category/priority |
| `TicketDetailPage.jsx` | Detail, `SlaTimer`, `TicketStatusStepper`, timeline, attachments + `ImageLightbox`, `CommentThread` |
| `AdminTicketsPage.jsx` | Staff table, filters, bulk assign/delete/resolve, performance table |
| `TechnicianDashboard.jsx` | Live assigned tickets + metrics + performance cards |

**Shared helpers:** `frontend/src/utils/ticketStatusDisplay.js` — `isResolvedLikeTicket`, `ticketStatusLabel` (handles **CLOSED** + resolution metadata).

### 2.2 Components (maintenance-related)

| Location | Components |
|----------|------------|
| `frontend/src/components/` | `TicketCard.jsx`, `ImageUploadZone.jsx` (react-dropzone), `CommentThread.jsx`, `CommentInput.jsx`, `PriorityBadge.jsx`, `StatusBadge.jsx`, `TicketStatusStepper.jsx`, `AssignTechnicianModal.jsx`, `SlaTimer.jsx`, `ImageLightbox.jsx`, `TicketAttachmentImage.jsx` |
| `frontend/src/components/dashboard/` | `AdminTechnicianPanel.jsx`, `DashboardPrimitives.jsx`, `DashboardCards.jsx` |

### 2.3 API client

- `frontend/src/api/ticketApi.js` — axios calls for all ticket/comment/export/performance endpoints.

---

## 3. Tests (inventory)

### 3.1 Backend (`backend/src/test/java/com/smartcampus/maintenance/`)

| File | Focus |
|------|--------|
| `service/TicketServiceTest.java` | Status transitions, SLA helpers, assign flow |
| `service/AttachmentServiceTest.java` | File type, size, max count |
| `service/CommentServiceTest.java` | Ownership, admin delete |
| `controller/TicketControllerIntegrationTest.java` | Multipart, filters, export (needs DB) |
| `controller/CommentControllerIntegrationTest.java` | Comment CRUD + auth (needs DB) |

*Integration tests require a running PostgreSQL configuration (see `application-test` / project docs).*

### 3.2 Frontend (`frontend/src/components/`)

| File | Focus |
|------|--------|
| `SlaTimer.test.jsx` | Breach / resolved behaviour |
| `ImageLightbox.test.jsx` | Navigation / close |

Run: `cd frontend && npm run test`

---

## 4. Documentation

| Document | Location |
|----------|----------|
| API reference | `backend/API_DOCUMENTATION.md` |
| Auth | `backend/AUTHENTICATION.md` |
| Swagger UI | `http://localhost:8081/swagger-ui.html` (when server runs) |
| Project README | `README.md` |

---

## 5. Completion criteria (all checked)

- [x] Ticket CRUD, workflow, assignment, comments, attachments
- [x] SLA policy + UI timer + scheduled escalation
- [x] Technician performance + CSV export
- [x] Admin bulk actions + filters
- [x] Technician dashboard on live API + resolved/CLOSED handling
- [x] Unit + integration + selected frontend tests
- [x] API docs + Swagger

---

**Checklist version:** 3.0
