# Module D+E — Progress Tracker (Notifications, Auth & System Integration)

**Spec:** IT3030 PAF 2026 — Smart Campus Operations Hub — Module D+E (OAuth 2.0 + JWT, Role Management, Notification System, Admin Dashboard).

**Legend**

| Status | Meaning |
|--------|---------|
| **Done** | Implemented and broadly aligned with the guide |
| **Partial** | Exists but differs from spec, incomplete, or only covers a subset |
| **Missing** | Not found in the codebase (as of this audit) |

Use this file step-by-step: work **Missing** and **Partial** items toward **Done**.

---

## 4.1 Backend — Spring Boot API

### Package structure (`com.smartcampus.auth` + `com.smartcampus.notification`)

| Item | Status | Notes |
|------|--------|--------|
| `auth/controller/AuthController.java` | **Done** | `/api/auth/google`, `/api/auth/login`, `/api/auth/me` |
| `auth/controller/UserController.java` | **Partial** | User APIs live under `com.smartcampus.user.controller`, not `auth.controller` (acceptable split; differs from guide diagram) |
| `auth/service/AuthService.java` | **Done** | Google + local password sign-in, profile |
| `auth/service/UserService.java` | **Partial** | Implemented as `com.smartcampus.user.service.UserService` |
| `auth/service/JwtService.java` | **Done** | HS256, configurable expiry (default 24h) |
| `auth/config/SecurityConfig.java` | **Partial** | CORS + security chain live in `com.smartcampus.maintenance.config.SecurityConfig` (not a dedicated `auth.config.SecurityConfig`) |
| `auth/config/OAuth2Config.java` | **Missing** | No separate OAuth2 config bean; Google verification uses `GoogleOAuthTokenVerifier` + `google-api-client` (not `spring-security-oauth2-client` as in guide) |
| `auth/config/CorsConfig.java` | **Partial** | CORS is configured inside `SecurityConfig` (`corsConfigurationSource` bean), not a standalone `CorsConfig` class |
| `auth/model/User.java` | **Partial** | Entity is `com.smartcampus.user.model.User` (not under `auth.model`) |
| `auth/model/Role.java` (Enum) | **Partial** | `com.smartcampus.user.model.Role` has `USER`, `ADMIN`, `TECHNICIAN` only — **no `MANAGER`** |
| `auth/dto/AuthResponseDTO.java` | **Done** | |
| `auth/dto/UserProfileDTO.java` | **Partial** | Profile DTO exists as `com.smartcampus.user.dto.UserProfileDTO` |
| `auth/dto/UpdateRoleDTO.java` | **Partial** | Exists under `com.smartcampus.user.dto` |
| `auth/filter/JwtAuthFilter.java` | **Partial** | Implemented as `JwtAuthenticationFilter` (same role) |
| **`com.smartcampus.notification` package** | **Missing** | No `NotificationController`, `NotificationService`, repository, model, or listeners |

### Entity: `User.java` (guide fields)

| Field | Status | Notes |
|-------|--------|--------|
| `id` Long `@Id` `@GeneratedValue` | **Done** | |
| `email` unique | **Done** | |
| `name` | **Done** | |
| `avatarUrl` | **Done** | |
| `provider` GOOGLE / LOCAL | **Done** | Enum name: `AuthProvider` |
| `roles` Set&lt;Role&gt; | **Done** | `MANAGER` role not in enum |
| `enabled` | **Done** | |
| `createdAt` `@CreationTimestamp` | **Done** | |

Extra fields present: `passwordHash`, `technicianCategory` (beyond minimal spec).

### Entity: `Notification.java`

| Item | Status |
|------|--------|
| Full entity + enums (`BOOKING_APPROVED`, …, `referenceType`, etc.) | **Missing** |

### REST endpoints

| Method | Endpoint | Auth | Status | Notes |
|--------|----------|------|--------|-------|
| GET | `/api/auth/me` | USER | **Done** | |
| POST | `/api/auth/google` | PUBLIC | **Done** | Body `{ idToken }` |
| GET | `/api/users` | ADMIN | **Partial** | List works; **no role filter** query param as in guide |
| GET | `/api/users/{id}` | ADMIN | **Done** | |
| PATCH | `/api/users/{id}/role` | ADMIN | **Done** | |
| PATCH | `/api/users/{id}/enable` | ADMIN | **Done** | |
| GET | `/api/notifications` | USER | **Missing** | |
| PATCH | `/api/notifications/{id}/read` | USER | **Missing** | |
| PATCH | `/api/notifications/read-all` | USER | **Missing** | |
| DELETE | `/api/notifications/{id}` | USER | **Missing** | |

Extra backend endpoints exist (e.g. `/api/auth/login`, technician CRUD under `/api/users/technicians`) — not part of the D+E minimal table but useful for the app.

### OAuth 2.0 + JWT flow (steps 1–10)

| Step | Status | Notes |
|------|--------|--------|
| 1–2 Frontend Google ID token → POST `/api/auth/google` | **Done** | `@react-oauth/google` + `LoginPage` |
| 3 Verify with Google | **Partial** | Uses Google API client / verifier; guide mentions `spring-security-oauth2-client` |
| 4–5 Extract claims; find/create user; USER on first login | **Done** | |
| 6 App JWT HS256, claims | **Partial** | Uses `userId`, `email`, `roles` claims; **subject is email**, not `sub: userId` as in guide wording |
| 7 `AuthResponseDTO` | **Done** | |
| 8 Bearer token on requests | **Done** | |
| 9 `JwtAuthenticationFilter` + `SecurityContext` | **Done** | |
| 10 `@PreAuthorize` / method security | **Done** | e.g. `UserController` class-level ADMIN |

**Dev-only behaviour:** `DevAuthFilter` and `dummy-google-token` / simulated tokens — document for demo vs production.

### Notification service architecture (events + listeners)

| Item | Status | Notes |
|------|--------|--------|
| `NotificationService` + persistence | **Missing** | |
| `BookingEventListener` | **Missing** | No booking event wiring found for notifications |
| `TicketEventListener` | **Missing** | `TicketStatusChangedEvent` / `NewCommentEvent` are published in maintenance services, but **no `@EventListener`** creates notifications |
| Future SSE/WebSocket | **Missing** | |

---

## 4.2 Frontend — React Pages & Components

### Pages under `src/pages/member4/`

| Page | Status | Notes |
|------|--------|--------|
| `LoginPage.jsx` | **Done** | Google + optional password login, navigation after sign-in |
| `ProfilePage.jsx` | **Missing** | |
| `AdminUsersPage.jsx` | **Missing** | |
| `NotificationPanel.jsx` | **Missing** | |
| `AdminDashboardPage.jsx` | **Partial** | `pages/dashboards/AdminDashboard.jsx` exists with ticket/user metrics; bookings total is **placeholder sample**; not under `member4/` |
| `UnauthorizedPage.jsx` | **Missing** | |
| `NotFoundPage.jsx` | **Missing** | No catch-all 404 route component found |

Other `member4` files: `HomePage.jsx`, `LandingPage.jsx` (extra).

### Authentication context & guards

| Item | Status | Notes |
|------|--------|--------|
| `AuthContext.jsx` — token, user, login, logout, `isAuthenticated` | **Partial** | Token persisted in **sessionStorage** (`AUTH_TOKEN_STORAGE_KEY`); guide asks for token **in memory only** |
| `ProtectedRoute.jsx` | **Partial** | Auth + bootstrap; **no `requiredRoles` prop** |
| App mount: restore via GET `/api/auth/me` | **Done** | When token exists |
| Axios: attach Bearer | **Done** | `axiosInstance` request interceptor |
| Axios: 401 → logout + redirect | **Missing** | No response interceptor; 401 only affects error strings in auth error helper |

### Notification UI

| Item | Status | Notes |
|------|--------|--------|
| Bell + unread badge in `TopBar` / `AppShell` | **Missing** | Header shows user + logout only |
| `NotificationPanel` drawer | **Missing** | |
| `useNotifications` + React Query 30s refetch | **Missing** | |

---

## 4.3 Innovation (Member 4)

| Innovation | Status | Notes |
|------------|--------|--------|
| SSE real-time notifications (`SseEmitter`) | **Missing** | |
| Admin dashboard: system-wide metrics (bookings week, tickets by priority, user growth chart) | **Partial** | Admin dashboard has ticket/user counts; bookings **not** wired; **no charts** / user growth |
| Role-based onboarding (`react-joyride`) | **Missing** | |
| Notification preferences (per category) | **Missing** | |
| Audit log (admin view of actions) | **Missing** | |

---

## 4.4 Testing responsibilities

| Test | Status | Notes |
|------|--------|-------|
| Unit: `JwtService` (generate, validate, expiry, tampered token) | **Missing** | No `JwtServiceTest` in `src/test` |
| Unit: `NotificationService` (events → correct records) | **Missing** | No notification module |
| Integration: OAuth flow with mocked Google verification | **Missing** | |
| Integration: USER → ADMIN endpoint returns 403 | **Missing** | Maintenance tests use auth mocks; no dedicated authz test for `/api/users` |
| Integration: Notification CRUD | **Missing** | |

Existing tests cover maintenance (tickets, comments, attachments), not Module D+E items above.

---

## Quick summary

| Area | Done | Partial | Missing |
|------|------|---------|---------|
| Core auth API + JWT + Google sign-in | Most | Package naming, JWT `sub` claim, token storage story | — |
| User admin endpoints | Most | Role filter on list | — |
| `MANAGER` role | — | — | Enum + any UI/backend use |
| Notification **backend** | — | — | **All** |
| Notification **frontend** | — | — | **All** |
| Spec pages (profile, admin users, errors, panel) | Login + partial admin dash | Admin dashboard location/content | Profile, AdminUsers, Unauthorized, NotFound, NotificationPanel |
| Innovation block | — | Admin metrics partly | SSE, joyride, prefs, audit |
| Module D+E tests | — | — | **All listed** |

---

## Suggested order of work (for your step-by-step runs)

1. **Notification domain:** JPA entity, enums, repository, service, REST API, security rules.  
2. **Event listeners:** Subscribe to existing ticket (and later booking) events → create notifications.  
3. **Frontend:** API client + `useNotifications`, bell + `NotificationPanel`, optional polling or SSE.  
4. **Gap-fill pages:** `ProfilePage`, `AdminUsersPage`, `UnauthorizedPage`, `NotFound` route.  
5. **Align spec details:** `MANAGER` role, `GET /api/users?role=`, JWT claims if markers require `sub`, response interceptor on 401.  
6. **Innovation (if required):** SSE endpoint, richer admin analytics, joyride, preferences, audit log.  
7. **Tests:** `JwtService` unit tests first, then notification + security integration tests.

*This file is audit-only — no implementation was performed when generating it.*
