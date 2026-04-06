# Module D+E — Progress Tracker (Notifications, Auth & System Integration)

**Spec:** IT3030 PAF 2026 — Smart Campus Operations Hub — Module D+E (OAuth 2.0 + JWT, Role Management, Notification System, Admin Dashboard).

**Legend**

| Status | Meaning |
|--------|---------|
| **Done** | Implemented and broadly aligned with the guide |
| **Partial** | Differs from spec, incomplete, or subset only |
| **Missing** | Not in the codebase |

Last reviewed: matches repo after Member 4 hardening (MANAGER, JWT `sub`, in-memory front-end token, security integration tests, H2 test profile, error JSON consistency).

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
12. **MANAGER** role end-to-end: **`Role.MANAGER`**, **UserController** `hasAnyRole('ADMIN','MANAGER')`, **Authz** + ticket/comment routes (parity with admin/staff where required).
13. **JWT `sub` = user id** in **JwtService**; **`JwtAuthenticationFilter`** resolves user id from **`userId` claim or `sub`**; email **only** from **`email`** claim (not `sub`).
14. Frontend **in-memory JWT** (**`authTokenMemory`**, **AuthContext** without `sessionStorage`); **axiosInstance** reads bearer from memory; refresh = logged out (strict “memory only” wording).
15. **`ProtectedRoute` `requiredRoles`**, **`getDashboardRoute` / AppShell / HomePage / AdminFacilityRoute / AdminUsersPage** updated for MANAGER where appropriate.
16. **Test profile**: H2 in-memory + **`application-test.properties`** (JWT secret, empty Google client id, Supabase placeholders) so **`@ActiveProfiles("test")`** needs no Postgres.
17. **Integration tests**: **`Member4SecurityIntegrationTest`** (USER 403 on `/api/users`, ADMIN 200, notifications for USER), **`AuthGoogleIntegrationTest`** (mock **GoogleOAuthTokenVerifier**, `POST /api/auth/google`).
18. **Regression fixes for tests**: MockMvc uses real **Bearer JWT** (not `SecurityContextHolder` alone); ticket/comment **`@BeforeEach`** deletes **`notifications`** before users; **`GlobalExceptionHandler`** maps **`ResponseStatusException`** to `{ status, error, message }`; **`CommentDTO`** **`@JsonProperty("isEdited")`** for JSON shape; unit/integration assertions aligned with actual validation messages.

If your branch differs, diff against the paths and endpoints below.

---

## Suggested git commits (messages)

Use one commit per bullet, or squash where your team prefers fewer commits.

1. `feat(auth): add MANAGER role and align ticket/user authorization helpers`
2. `fix(auth): use JWT sub as user id and resolve principal from sub or userId claim`
3. `feat(frontend): store access token in memory only and wire axios + protected routes`
4. `chore(test): add H2 test profile and integration tests for OAuth mock and user-list authz`
5. `fix(api): handle ResponseStatusException in GlobalExceptionHandler; fix CommentDTO isEdited JSON`
6. `test(maintenance): use Bearer JWT and notification cleanup in ticket/comment integration tests`
7. `test(attachments): align AttachmentServiceTest assertions with current error messages`

---

## 4.1 Backend — Spring Boot API

### Package structure (`com.smartcampus.auth` + `com.smartcampus.notification`)

| Item | Status | Notes |
|------|--------|--------|
| `auth/controller/AuthController.java` | **Done** | + **`PATCH /me`**, `GET/POST` as before |
| `user/controller/UserController.java` | **Partial** | Not under `auth.controller`; **`GET /users?role=`** supported; **ADMIN or MANAGER** |
| `notification/*` | **Done** | Entity, repo, service, controller, listeners under `com.smartcampus.notification` |
| `OAuth2Config` / `spring-security-oauth2-client` | **Missing** | Google via **GoogleOAuthTokenVerifier** + google-api-client |
| `CorsConfig` standalone | **Partial** | CORS in **SecurityConfig** |
| `Role` / **MANAGER** | **Done** | **`USER, ADMIN, TECHNICIAN, MANAGER`** |
| `auth/filter/JwtAuthFilter` | **Done** | Named **JwtAuthenticationFilter**; **`sub`** = user id |

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
| GET | `/api/users` | **Done** + **`?role=`** (ADMIN/MANAGER) |
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
| 1–10 overall | **Partial** | Works end-to-end; **JWT `sub`** = **user id**; **`email`**, **`userId`**, **`roles`** claims |

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
| `AdminUsersPage.jsx` | **Done** | **Roles read-only**; enable/disable others only; **MANAGER** in filters |
| `NotificationPanel.jsx` | **Partial** | Under **`components/notifications/`** (not `member4/`) |
| Admin dashboard | **Partial** | `AdminDashboard.jsx`; bookings still sample if unchanged |
| `UnauthorizedPage.jsx` | **Done** | Route `/unauthorized` |
| `NotFoundPage.jsx` | **Done** | `path="*"` |

### Auth & HTTP

| Item | Status |
|------|--------|
| `AuthContext` + bootstrap | **Done** | Token in **memory** + React state (not `sessionStorage`) |
| `ProtectedRoute` | **Done** | Optional **`requiredRoles`** → **`/unauthorized`** |
| Axios Bearer | **Done** | From **memory** store |
| **401** → logout + `/login` | **Done** | **AuthUnauthorizedBridge** |

### Notification UI

| Item | Status |
|------|--------|
| Bell + badge + 30s refetch | **Done** | `useNotifications` |

---

## 4.3 Innovation (Member 4)

| Item | Status |
|------|--------|
| SSE | **Done** |
| Full admin analytics (charts, bookings week, user growth) | **Partial** / **Missing** |
| `react-joyride` | **Missing** |
| Notification preferences | **Done** |
| Audit log | **Missing** |

---

## 4.4 Testing responsibilities

| Test | Status |
|------|--------|
| Unit: **JwtService** | **Done** | `JwtServiceTest` |
| Unit: **NotificationService** / listeners | **Done** | `NotificationServiceImplTest`, `TicketEventListenerTest` |
| Integration: OAuth mock | **Done** | `AuthGoogleIntegrationTest` |
| Integration: USER → **403** on `/api/users` | **Done** | `Member4SecurityIntegrationTest` |
| Integration: Notification **HTTP** CRUD | **Partial** | Covered indirectly; dedicated notification-controller MockMvc suite optional |

---

## Quick summary

| Area | Status |
|------|--------|
| Auth API + JWT + Google + profile patch | **Mostly done** |
| Users admin API | **Done**; UI **read-only roles** |
| Notifications backend + listeners + REST | **Done** |
| Notifications frontend | **Done** (polling + SSE) |
| Error pages + 401 redirect | **Done** |
| `MANAGER`, in-memory token, `requiredRoles` | **Done** |
| SSE, innovation extras | **Partial** / **Done** |
| Integration tests (OAuth, authz) | **Done** |
| API errors from **ResponseStatusException** as JSON `message` | **Done** |

---

## Suggested **next** work (if marks require them)

1. **Notification controller** integration tests (mark read, read-all, delete) with JWT fixtures.
2. Coursework **innovation** items your rubric weights (SSE, audit, joyride, etc.).
3. Optional: **`@WebMvcTest`** slices for faster controller-only runs.
