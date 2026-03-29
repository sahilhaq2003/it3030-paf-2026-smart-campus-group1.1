# MEMBER 3 — Detailed Recommendations (Audit Archive)

**Date:** March 29, 2026  
**Module:** Maintenance & Incident Ticketing (Member 3)  
**Status:** **All critical and high-priority items addressed** (see resolution table below)

This document preserved the original evidence-based audit. Use **`MEMBER3_VIVA_GUIDE.md`** for exam preparation and **`MEMBER3_IMPLEMENTATION_CHECKLIST.md`** for the current file-level status.

---

## Resolution summary (2026-03-29)

| Original issue | Resolution |
|------------------|------------|
| TechnicianDashboard mock data | **Fixed:** `useQuery` + `ticketApi.getAssignedTickets`, `getTechnicianPerformance`, metrics via `isResolvedLikeTicket` (API stores resolve as `CLOSED`), static `scheduleStatus` placeholder for UI section |
| Missing unit tests | **Added:** `AttachmentServiceTest`, `CommentServiceTest`; expanded `TicketServiceTest` (SLA policy, status flows) |
| Missing integration tests | **Added:** `TicketControllerIntegrationTest`, `CommentControllerIntegrationTest` |
| No frontend component tests | **Added:** `SlaTimer.test.jsx`, `ImageLightbox.test.jsx` (Vitest) |
| API documentation | **Present:** Springdoc OpenAPI + `backend/API_DOCUMENTATION.md`, Swagger UI at `/swagger-ui.html` |
| README / module docs | **Updated:** root `README.md` with features and links |
| Comment UI: admin editing others’ comments | **Fixed:** `CommentThread.jsx` — edit **author only**; admin may **delete** any comment (matches backend) |
| Image upload | **Updated:** `ImageUploadZone.jsx` uses **react-dropzone** |
| Ticket detail timeline markup | **Fixed:** `<ul>` wrapper for timeline `<li>` items |

---

## Optional / out of scope

| Topic | Note |
|-------|------|
| Local disk `uploads/tickets/{ticketId}/` | Not used; **Supabase Storage** + UUID `storedName` (by design) |
| Postman collection | Optional; Swagger covers interactive testing |

---

## Historical sections (original audit)

The sections below described gaps **before** the work above. They are kept for traceability only; they are **not** current blockers.

<details>
<summary>Original CRITICAL: TechnicianDashboard mock data (resolved)</summary>

Previously `TechnicianDashboard.jsx` used hardcoded arrays. Now it loads assigned tickets and performance from the API and aligns “resolved” with `isResolvedLikeTicket` from `ticketStatusDisplay.js`.

</details>

<details>
<summary>Original HIGH: tests & integration (resolved)</summary>

Service tests, controller integration tests, and Vitest component tests were added as listed in the resolution table.

</details>

---

**Document version:** 3.0 (completion)  
**Supersedes:** v2.0 audit “not fixed” language
