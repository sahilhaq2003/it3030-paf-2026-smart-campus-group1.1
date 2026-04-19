# Smart Campus

A full-stack application for campus facility maintenance: report issues, track tickets through resolution, and coordinate technicians and admins. The stack is a **Spring Boot** REST API and a **React (Vite)** frontend with Tailwind CSS.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Starting the Application](#starting-the-application)
- [Database & Environment](#database--environment)
- [Testing](#testing)
- [Documentation](#documentation)
- [Technology Stack](#technology-stack)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

The Smart Campus Maintenance System supports:

- **End users** creating and following their own tickets
- **Technicians** viewing assigned work, updating status, and collaborating via comments
- **Administrators** managing the full ticket queue, technician roster, exports, and user roles

Authentication uses **JWT** (Google OAuth and email/password). File attachments can be stored using **Supabase Storage** (configurable via environment variables).

---

## Features

### Authentication & sessions

- **Google OAuth** sign-in and **email/password** login
- **JWT**-secured API; `/auth/me` for the current profile
- **Role-based access**: `USER`, `TECHNICIAN`, `ADMIN` (see `backend/AUTHENTICATION.md`)
- Frontend **role-aware routing** (user vs staff dashboards, protected ticket routes)

### Facility Booking & QR Verification

- **Book facilities** with real-time availability checking and conflict detection.
- **Booking Lifecycle**: Request transitions (PENDING → APPROVED / REJECTED / CANCELLED) with detailed rejection notes.
- **Automated QR Tickets**: Generates QR codes via Google ZXing and embeds them inline into HTML emails upon approval.
- **Public Scanner API**: Secure endpoint (`/api/bookings/public/{id}`) to quickly verify tickets via mobile scanners without exposing sensitive data.
- **Admin Analytics**: Centralized dashboard to track total bookings, peak hours, and top facilities.

### Maintenance tickets

- Create tickets with category, priority, location, optional facility link, and **multipart attachments**
- List and filter tickets (status, category, priority, assignee) for staff; **“my tickets”** for users
- **Status workflow** with validated transitions (e.g. OPEN → IN_PROGRESS → RESOLVED → CLOSED)
- **Assign technicians**; auto-move to IN_PROGRESS when assigned from OPEN
- Ticket owner receives a **system notification + optional email** when:
  - a ticket is submitted
  - a technician is assigned by admin/manager
- **Resolution notes** and rejection flows where applicable
- **Delete ticket** (with attachment cleanup)

### Notifications (in-app + email)

- Backend notifications API with SSE stream support for real-time updates
- Notification preferences per user:
  - `inAppEnabled` controls notification list/stream visibility
  - `emailEnabled` controls system email delivery
- System emails are sent for eligible notification events (using SMTP)
- **Admins do not receive system emails** (in-app notifications still apply)
- HTML email template: `backend/src/main/resources/templates/system-notification-email.html`

### SLA & operations

- **Per-priority SLA windows** from creation time (policy in `SlaPolicy`: e.g. CRITICAL 2h, HIGH 8h, MEDIUM 24h, LOW 72h)
- Persisted **`slaDeadline`** on tickets; **SLA violated** flag in API responses
- **Scheduled job** (`SlaEscalationJob`): escalates long-open **LOW** priority tickets to **MEDIUM** (runs every 30 minutes)
- Frontend **`SlaTimer`** component for showing deadline / countdown on ticket views

### Analytics & export

- **Technician performance** endpoint: resolved counts and average resolution time (aggregated)
- **CSV export** of tickets (with filters) for reporting

### Comments

- Threaded comments per ticket; **create, list, update, delete** (author rules enforced in service layer)

### User & technician administration (admin)

- List users; **list technicians** for assignment UIs
- **Create / update / delete technicians** (email, name, password); safe delete with checks (e.g. tickets reported, assignments cleared)
- **Change user role** and **toggle enable/disable**

### Frontend UX

- **Dashboards**: Admin, Technician, and User home with navigation via `AppShell`
- **Admin ticket board** (`/admin/tickets`) and **technician dashboard** for staff workflows
- **Ticket detail** with status stepper, priority badges, **comment thread**, **assign technician** modal
- **Image attachment preview** and **ImageLightbox** for viewing uploads
- **Image upload zone** and drag-and-drop style flows where implemented
- Profile page supports display-name updates; avatar URL editing is hidden from profile form
- Top bar profile icon renders user avatar image (with fallback avatar)
- Facilities directory heading style aligned with other main app pages
- Responsive layout with **Tailwind CSS**; shared components (badges, modals, skeletons, data tables)

### Developer experience

- **OpenAPI / Swagger UI** at `/swagger-ui.html` (backend running)
- **API reference**: `backend/API_DOCUMENTATION.md`
- **Auth details**: `backend/AUTHENTICATION.md`
- **Setup & deployment**: `DEVELOPMENT_SETUP.md`, `DEPLOYMENT.md`, `TROUBLESHOOTING.md`
- **Frontend unit tests**: Vitest (`npm run test` in `frontend/`)
- **Backend tests**: JUnit 5 / Mockito (`backend/src/test/java/...`)

---

## Member Contribution

| Member | GitHub Handle | Main Work |
|--------|---------------|-----------|
| Member 1 | `sakithruhunuge` | Facility comparison feature; facilities admin dashboard; filtering/search UI improvements |
| Member 2 | `pasindi15` | Ticket status workflow & technician operations; admin/users management; comment handling & SLA-related updates |
| Member 3 | `sahilhaq2003` | Auth/JWT + role-based authorization updates (including `MANAGER`); notifications backend + related unit tests |
| Member 4 | `SAHIL HAQ` | Integration/security hardening for Member 4; error-response JSON consistency for tests; CI workflow + final polish |

## Project Structure

```
smart-campus/
│
├── backend/                          # Spring Boot REST API
│   ├── src/main/java/com/smartcampus/
│   │   ├── auth/                     # JWT, Google OAuth, login
│   │   ├── facilities/               # Facilities (facility-linked tickets)
│   │   ├── maintenance/              # Tickets, comments, attachments, SLA, schedulers
│   │   └── user/                     # Users, roles, technician admin
│   ├── src/test/                     # Unit & integration tests
│   ├── API_DOCUMENTATION.md
│   ├── AUTHENTICATION.md
│   ├── pom.xml
│   └── mvnw.cmd / mvnw               # Maven Wrapper
│
├── frontend/                         # React + Vite + Tailwind
│   ├── src/
│   │   ├── api/                      # axios client, ticketApi, etc.
│   │   ├── components/               # SlaTimer, ImageLightbox, CommentThread, modals, …
│   │   ├── context/                  # AuthContext
│   │   ├── layouts/                  # AppShell
│   │   ├── pages/                    # member3 (tickets), member4 (auth/home), …
│   │   ├── routes/                   # Protected & role-based routes
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vitest.config.js
│   ├── package.json
│   └── vite.config.js
│
├── DEVELOPMENT_SETUP.md
├── DEPLOYMENT.md
├── TROUBLESHOOTING.md
└── README.md
```

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| **JDK 17+** | Required for Spring Boot 3.2.x |
| **Node.js 18+** | For Vite + React |
| **PostgreSQL** | Database (e.g. local Postgres or hosted such as Supabase) |
| **Maven** | Optional if you use `mvnw` / `mvnw.cmd` from `backend/` |

Verify:

```bash
java -version
node -v
npm -v
```

---

## Installation

```bash
cd smart-campus
```

**Backend** — dependencies resolve via Maven on first run:

```bash
cd backend
# Windows
.\mvnw.cmd -q compile
```

**Frontend**:

```bash
cd frontend
npm install
```

---

## Starting the Application

### Backend

```bash
cd backend
# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

Default **API base URL** (see `application.properties`): **http://localhost:8081**  
**Swagger UI**: **http://localhost:8081/swagger-ui.html**

### Frontend

```bash
cd frontend
npm run dev
```

**App URL**: **http://localhost:5173**

Ensure the database is reachable and credentials match your `application.properties` (or environment variables) before starting the backend.

---

## Database & Environment

The backend uses **PostgreSQL** with **Spring Data JPA** (`ddl-auto` is typically `update` in dev). Configure connection URL, username, and password in `backend/src/main/resources/application.properties` or override with environment variables as appropriate for your deployment.

**Supabase** (optional): set `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and bucket name for attachment storage; see `application.properties` for `supabase.*` keys.

### SMTP / System email configuration (optional)

Add these values to `backend/.env` (or OS env vars):

```env
APP_MAIL_ENABLED=true
APP_MAIL_FROM=your-email@example.com
SPRING_MAIL_USERNAME=your-email@example.com
SPRING_MAIL_PASSWORD=your-app-password
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
```

For Gmail, use an **App Password** (not your normal Gmail password).

Do **not** commit production secrets; use `.env` or your host’s secret store in real deployments.

---

## Testing

**Frontend** (Vitest):

```bash
cd frontend
npm run test
```

**Backend** (Maven):

```bash
cd backend
.\mvnw.cmd test
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| `backend/API_DOCUMENTATION.md` | REST endpoints and models |
| `backend/AUTHENTICATION.md` | JWT and OAuth flow |
| `DEVELOPMENT_SETUP.md` | Detailed local setup |
| `DEPLOYMENT.md` | Deployment notes |
| `TROUBLESHOOTING.md` | Common issues |

---

## Technology Stack

### Backend

| Technology | Purpose |
|------------|---------|
| Spring Boot 3.2.x | Web, validation, scheduling |
| Spring Security + JWT | API security |
| Spring Data JPA | Persistence |
| Spring Mail | SMTP system emails |
| PostgreSQL | Database |
| Springdoc OpenAPI | Swagger UI |
| Maven | Build |

### Frontend

| Technology | Purpose |
|------------|---------|
| React | UI |
| Vite | Dev server & build |
| Tailwind CSS | Styling |
| TanStack React Query | Server state (where used) |
| Axios | HTTP |
| Vitest | Unit tests |

---

## Configuration

| Area | Location |
|------|----------|
| Server port, DB, JWT, Supabase, Swagger | `backend/src/main/resources/application.properties` |
| Security / CORS | `backend/.../config/` (e.g. `SecurityConfig`) |
| API base URL | `frontend/src/api/axiosInstance.js` (or env as configured) |

---

## Troubleshooting

- **Backend won’t start**: confirm PostgreSQL is up and URL/credentials match; check port **8081** is free.
- **Frontend API errors**: ensure backend URL matches the frontend axios base URL and CORS allows your origin.
- **Maven**: use `backend/mvnw.cmd` if `mvn` is not on PATH.
- More detail: `TROUBLESHOOTING.md`.

---

## License

This project is part of the Smart Campus initiative. All rights reserved by the project team.

---

**Last updated:** March 30, 2026
