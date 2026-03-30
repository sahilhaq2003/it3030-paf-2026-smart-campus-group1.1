# Module D+E — Progress Tracker (Notifications, Auth & System Integration)

**Spec:** IT3030 PAF 2026 — Smart Campus Operations Hub — Module D+E (OAuth 2.0 + JWT, Role Management, Notification System, Admin Dashboard).

**Legend**

| Status | Meaning |
|--------|---------|
| **Done** | Implemented and broadly aligned with the guide |
| **Partial** | Differs from spec, incomplete, or subset only |
| **Missing** | Not in the codebase |

Last reviewed: matches repo **after** notifications stack, profile/users UI, auth UX, filters, error pages, read-only admin roles, and tests listed in §4.4.

---

## Implementation flow (order we followed in-repo)

Use this as the **step sequence** that was applied (aligns with your incremental “next” tasks):

1. Notification **entity**, **enums**, **repository** + `MaintenanceApplication` JPA scan.
2. **NotificationService** / **NotificationServiceImpl** + repo helpers (ownership, mark-all-read).
3. **NotificationController** + **NotificationResponseDTO**; secured by existing `authenticated()` chain.
4. **TicketEventListener** + stub **BookingEventListener**; ticket comment/status → notifications.
5. Frontend: **notificationsApi**, **useNotifications** (30s refetch), **NotificationPanel**, bell in **AppShell**.
6. **ProfilePage**, **PATCH /api/auth/me**, **createdAt** on **UserResponseDTO**, **AuthContext** `updateProfile`.
7. **AdminUsersPage**, `/admin/users`, sidebar; later **roles read-only** (no role edits from UI).
8. **GET /api/users?role=** + admin filter dropdown.
9. **UnauthorizedPage**, **NotFoundPage**, catch-all route.
10. **401** axios → **logout** + `/login` via **AuthUnauthorizedBridge**.
11. **JwtServiceTest**; **NotificationServiceImplTest** + **TicketEventListenerTest**.

If your branch differs, diff against the paths and endpoints below.

---

## 4.1 Backend — Spring Boot API

### Package structure (`com.smartcampus.auth` + `com.smartcampus.notification`)

| Item | Status | Notes |
|------|--------|--------|
| `auth/controller/AuthController.java` | **Done** | + **`PATCH /me`**, `GET/POST` as before |
| `user/controller/UserController.java` | **Partial** | Not under `auth.controller`; **`GET /users?role=`** supported |
| `notification/*` | **Done** | Entity, repo, service, controller, listeners under `com.smartcampus.notification` |
| `OAuth2Config` / `spring-security-oauth2-client` | **Missing** | Google via **GoogleOAuthTokenVerifier** + google-api-client |
| `CorsConfig` standalone | **Partial** | CORS in **SecurityConfig** |
| `Role` / **MANAGER** | **Partial** | **USER, ADMIN, TECHNICIAN** only |
| `auth/filter/JwtAuthFilter` | **Partial** | Named **JwtAuthenticationFilter** |

### Entity: `Notification.java`

| Item | Status |
|------|--------|
| Fields per guide + `NotificationType` / `ReferenceType` | **Done** |

### REST endpoints (D+E table)

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/auth/me` | **Done** |
| PATCH | `/api/auth/me` | **Done** (profile update — extra vs bare table) |
| POST | `/api/auth/google` | **Done** |
| GET | `/api/users` | **Done** + **`?role=`** |
| GET | `/api/users/{id}` | **Done** |
| PATCH | `/api/users/{id}/role` | **Done** (API); **UI does not call** (by design) |
| PATCH | `/api/users/{id}/enable` | **Done** |
| GET | `/api/notifications` | **Done** |
| PATCH | `/api/notifications/{id}/read` | **Done** |
| PATCH | `/api/notifications/read-all` | **Done** |
| DELETE | `/api/notifications/{id}` | **Done** |

### OAuth + JWT flow

| Step | Status | Notes |
|------|--------|--------|
| 1–10 overall | **Partial** | Works end-to-end; **JWT `sub`** = email; claims include `userId`, `roles` |

### Notifications + events

| Item | Status |
|------|--------|
| **NotificationService** + DB | **Done** |
| **TicketEventListener** | **Done** |
| **BookingEventListener** | **Partial** | Stub until booking events exist |
| **SSE** / WebSocket | **Missing** |

---

## 4.2 Frontend

### Pages (`member4` + related)

| Page | Status | Notes |
|------|--------|--------|
| `LoginPage.jsx` | **Done** | |
| `ProfilePage.jsx` | **Done** | |
| `AdminUsersPage.jsx` | **Done** | **Roles read-only**; enable/disable others only |
| `NotificationPanel.jsx` | **Partial** | Under **`components/notifications/`** (not `member4/`) |
| Admin dashboard | **Partial** | `AdminDashboard.jsx`; bookings still sample if unchanged |
| `UnauthorizedPage.jsx` | **Done** | Route `/unauthorized` |
| `NotFoundPage.jsx` | **Done** | `path="*"` |

### Auth & HTTP

| Item | Status |
|------|--------|
| `AuthContext` + bootstrap | **Partial** | Token in **sessionStorage** (not “memory only” per strict spec wording) |
| `ProtectedRoute` | **Partial** | No **`requiredRoles`** prop |
| Axios Bearer | **Done** |
| **401** → logout + `/login` | **Done** | **AuthUnauthorizedBridge** |

### Notification UI

| Item | Status |
|------|--------|
| Bell + badge + 30s refetch | **Done** | `useNotifications` |

---

## 4.3 Innovation (Member 4)

| Item | Status |
|------|--------|
| SSE | **Missing** |
| Full admin analytics (charts, bookings week, user growth) | **Partial** / **Missing** |
| `react-joyride` | **Missing** |
| Notification preferences | **Missing** |
| Audit log | **Missing** |

---

## 4.4 Testing responsibilities

| Test | Status |
|------|--------|
| Unit: **JwtService** | **Done** | `JwtServiceTest` |
| Unit: **NotificationService** / listeners | **Done** | `NotificationServiceImplTest`, `TicketEventListenerTest` |
| Integration: OAuth mock | **Missing** |
| Integration: USER → **403** on `/api/users` | **Missing** |
| Integration: Notification **HTTP** CRUD | **Missing** |

---

## Quick summary

| Area | Status |
|------|--------|
| Auth API + JWT + Google + profile patch | **Mostly done** |
| Users admin API | **Done**; UI **read-only roles** |
| Notifications backend + listeners + REST | **Done** |
| Notifications frontend | **Done** (polling, not SSE) |
| Error pages + 401 redirect | **Done** |
| `MANAGER`, strict in-memory token, `requiredRoles`, SSE, innovation extras | **Missing** / **Partial** |
| Integration tests (OAuth, authz, notification API) | **Missing** |

---

## Suggested **next** work (if marks require them)

1. **`@WebMvcTest` / integration**: USER token → **403** on `GET /api/users`; notification controller CRUD with security.
2. **OAuth integration test** with mocked **GoogleOAuthTokenVerifier**.
3. Coursework **innovation** items your rubric weights (SSE, audit, joyride, etc.).
4. **`MANAGER` role** end-to-end if the brief requires it.
