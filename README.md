# 🏫 Smart Campus - Integrated Campus Management System

A comprehensive full-stack application for managing campus facilities, bookings, maintenance tickets, and user authentication. Built with **Spring Boot 3.x** REST API and **React (Vite)** frontend using **Tailwind CSS**.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Member Contributions](#-member-contributions)
3. [Features by Module](#-features-by-module)
4. [Project Structure](#project-structure)
5. [Tech Stack](#technology-stack)
6. [Prerequisites](#prerequisites)
7. [Installation & Setup](#installation--setup)
8. [Running the Application](#running-the-application)
9. [API Endpoints Summary](#api-endpoints-summary)
10. [Environment Configuration](#environment-configuration)
11. [Testing](#testing)
12. [Documentation](#documentation)
13. [Troubleshooting](#troubleshooting)

---

## Project Overview

Smart Campus is a modular application designed to streamline campus operations through **four integrated subsystems**, each managed by a dedicated team member:

```
┌─────────────────────────────────────────────────────────────┐
│            Smart Campus Management System                   │
├─────────────────────────────────────────────────────────────┤
│ Member 1        │ Member 2       │ Member 3        │ Mem 4  │
│ FACILITIES      │ BOOKINGS       │ MAINTENANCE     │ AUTH   │
│ Management      │ Reservations   │ Tickets & SLA   │ & NOTIF│
│ & Resources     │ QR Codes       │ Attachments     │        │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 Member Contributions

---

### **Member 1: Facility Management**
**🏢 Responsible for facility resource management and availability tracking**

**Key Responsibilities:**
- Manage campus facilities (classrooms, labs, auditoriums, etc.)
- Track facility availability and status
- Categorize resources by type and capacity
- Integrate with booking system for real-time availability

**Core Features:**
✅ CRUD operations for facilities  
✅ Facility status management (AVAILABLE, UNDER_MAINTENANCE, CLOSED)  
✅ Resource categorization (Classroom, Lab, Auditorium, Sports, etc.)  
✅ Pagination and filtering  
✅ Integration with booking availability checks  

**Backend Implementation:**
```
backend/src/main/java/com/smartcampus/facilities/
├── controller/FacilityController.java        # REST endpoints
├── service/FacilityService.java              # Business logic
├── model/Facility.java                       # JPA entity
├── repository/FacilityRepository.java        # Data access
└── dto/FacilityDto.java                      # DTOs
```

**Frontend Implementation:**
```
frontend/src/
├── pages/member1/AdminFacilitiesPage.jsx     # Main UI
├── api/facilityApi.js                        # API client
└── components/dashboard/DashboardCards.jsx   # UI cards
```

**Key Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/facilities` | List all facilities |
| POST | `/api/facilities` | Create new facility (ADMIN) |
| GET | `/api/facilities/{id}` | Get facility details |
| PUT | `/api/facilities/{id}` | Update facility (ADMIN) |
| PATCH | `/api/facilities/{id}/status` | Update status (ADMIN) |
| DELETE | `/api/facilities/{id}` | Delete facility (ADMIN) |

---

### **Member 2: Booking Management**
**📅 Responsible for facility reservations, booking lifecycle, and QR verification**

**Key Responsibilities:**
- Manage facility booking requests and approvals
- Generate QR codes for booking verification
- Send confirmation emails with booking details
- Provide booking analytics and reporting

**Core Features:**
✅ Real-time availability checking  
✅ Booking workflow (PENDING → APPROVED/REJECTED/CANCELLED)  
✅ **Automated QR Code Generation** (via Google ZXing)  
✅ **Email Notifications** with HTML templates and embedded QR codes  
✅ **Public Scanner API** for mobile verification  
✅ **Analytics Dashboard** (peak hours, approval rates, facility usage)  
✅ Conflict detection for overlapping bookings  
✅ Detailed rejection notes and review comments  

**Backend Implementation:**
```
backend/src/main/java/com/smartcampus/booking/
├── controller/BookingController.java         # REST endpoints
├── service/BookingService.java               # Business logic
├── model/Booking.java                        # JPA entity
├── util/QrCodeGenerator.java                 # QR generation
├── repository/BookingRepository.java         # Data access
└── dto/BookingResponseDTO.java               # Response DTOs
```

**Frontend Implementation:**
```
frontend/src/
├── pages/member2/AdminBookingsPage.jsx       # Bookings list
├── pages/member2/AdminReviewBookingPage.jsx  # Review & approve
├── pages/member2/AdminAnalyticsPage.jsx      # Analytics (INNOVATION)
└── api/bookingApi.js                         # API client
```

**Key Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking request |
| GET | `/api/bookings/my` | Get user's bookings |
| GET | `/api/bookings` | List all bookings (ADMIN) |
| GET | `/api/bookings/{id}` | Get booking details |
| GET | `/api/bookings/check-availability` | Check time slot availability |
| POST | `/api/bookings/{id}/approve` | Approve booking (ADMIN) |
| POST | `/api/bookings/{id}/reject` | Reject booking (ADMIN) |
| POST | `/api/bookings/{id}/cancel` | Cancel booking |
| GET | `/api/bookings/analytics` | Get analytics data (ADMIN) |
| GET | `/api/bookings/public/{id}` | Public scanner verification |

**📊 Analytics Dashboard Innovation:**
Displays real-time metrics:
- Total bookings, approval/rejection rates
- Peak booking hours heatmap
- Daily booking trends
- Top facilities by usage
- Approval rate percentages

**📧 Email Features:**
- Confirmation emails with booking details
- QR code embedded as image
- Responsive HTML template
- Auto-sent on approval

---

### **Member 3: Maintenance & Ticket Management**
**🔧 Responsible for ticket lifecycle, SLA management, and technician coordination**

**Key Responsibilities:**
- Manage maintenance ticket creation and status
- Track SLA compliance and escalate overdue tickets
- Coordinate technician assignments
- Store and manage ticket attachments

**Core Features:**
✅ Ticket creation with multipart file uploads  
✅ Category-based classification (Electrical, Plumbing, HVAC, etc.)  
✅ **Priority-based SLA Management** (CRITICAL 2h, HIGH 8h, MEDIUM 24h, LOW 72h)  
✅ **Real-time SLA Timer Component** (INNOVATION - updates every second)  
✅ Status workflow with validated transitions  
✅ Technician assignment with auto-status updates  
✅ **Supabase Storage** integration for file management  
✅ Threaded comments for collaboration  
✅ CSV export for reporting  
✅ **Technician Performance Analytics**  
✅ **Scheduled SLA Escalation** (LOW → MEDIUM after 7 days)  

**Backend Implementation:**
```
backend/src/main/java/com/smartcampus/maintenance/
├── controller/TicketController.java          # REST endpoints
├── controller/CommentController.java         # Comment endpoints
├── service/TicketServiceImpl.java             # Ticket logic
├── service/AttachmentService.java            # File handling
├── service/SupabaseStorageService.java       # Cloud storage
├── policy/SlaPolicy.java                     # SLA rules
├── job/SlaEscalationJob.java                 # Scheduled tasks
├── model/Ticket.java                         # JPA entity
├── model/Attachment.java                     # File entity
├── repository/TicketRepository.java          # Data access
└── dto/TicketResponseDTO.java                # Response DTOs
```

**Frontend Implementation:**
```
frontend/src/
├── pages/member3/CreateTicketPage.jsx        # Create tickets
├── pages/member3/AdminTicketsPage.jsx        # List tickets
├── pages/member3/TicketDetailPage.jsx        # View/edit tickets
├── pages/member3/AdminTicketStatsPage.jsx    # Performance stats
├── pages/member3/MyTicketsPage.jsx           # User's tickets
├── components/SlaTimer.jsx                   # INNOVATION: Real-time SLA
├── components/SLAStatusBadge.jsx             # SLA status display
├── components/ImageUploadZone.jsx            # File upload UI
├── components/TicketAttachmentImage.jsx      # Display attachments
├── components/CommentThread.jsx              # Comments UI
└── api/ticketApi.js                          # API client
```

**Key Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets` | Create new ticket |
| GET | `/api/tickets` | List all tickets (ADMIN/TECH) |
| GET | `/api/tickets/my` | Get user's tickets |
| GET | `/api/tickets/{id}` | Get ticket details |
| GET | `/api/tickets/search` | Search tickets by keyword |
| PATCH | `/api/tickets/{id}/status` | Update status |
| POST | `/api/tickets/{id}/assign` | Assign technician (ADMIN) |
| DELETE | `/api/tickets/{id}` | Delete ticket (ADMIN) |
| GET | `/api/tickets/performance` | Technician performance stats |
| GET | `/api/tickets/export` | Export to CSV (ADMIN) |
| POST | `/api/tickets/{id}/attachments` | Upload file |
| GET | `/api/tickets/{id}/attachments/{name}` | Download file |
| POST | `/api/tickets/{id}/comments` | Add comment |
| GET | `/api/tickets/{id}/comments` | Get comments |

**⏱️ SLA Timer Component (INNOVATION):**
Real-time countdown display that:
- Updates every second for smooth animation
- Shows elapsed time vs SLA limit
- Changes color based on status:
  - 🟢 Green: On track (normal)
  - 🟡 Orange: Warning (≤24hrs remaining)
  - 🔴 Red: Breached (exceeded SLA)
  - ✅ Green checkmark: Resolved/Closed
- Displays exact breach time when exceeded
- Handles resolved tickets separately
- Responsive design with visual hierarchy

**📎 Attachment Handling:**
- Validated file types (JPEG, PNG, WebP)
- 5MB size limit per file
- Max 3 files per ticket
- UUID-based storage for uniqueness
- Supabase Cloud Storage integration
- Public URL generation for downloads
- Auto-cleanup on ticket deletion

**📊 Technician Performance Analytics:**
- Resolved ticket counts per technician
- Average resolution time
- Performance ranking
- Trend analysis over time

**⏰ SLA Escalation Job:**
- Runs every 30 minutes
- Escalates LOW priority to MEDIUM if open >7 days
- Preserves creation date for SLA calculation

---

### **Member 4: Authentication & Notifications**
**🔐 Responsible for user authentication, security, and real-time notifications**

**Key Responsibilities:**
- Implement secure authentication (OAuth + JWT)
- Manage user accounts and roles
- Send real-time notifications (in-app + email)
- Handle notification preferences

**Core Features:**
✅ **Google OAuth Integration** (sign-in with Google accounts)  
✅ **Email/Password Authentication** (traditional login)  
✅ **JWT Token Management** (24-hour expiration)  
✅ **Role-Based Access Control** (USER, TECHNICIAN, ADMIN, LECTURER)  
✅ **User Profile Management** (name, email, avatar)  
✅ **Technician Management** (create/update/delete)  
✅ **Real-time Notifications** (SSE stream)  
✅ **Email Notifications** (HTML templates)  
✅ **OTP Verification** (for lecturer registration)  
✅ **Session Management** (token refresh, logout)  
✅ **User Preferences** (notification opt-in/out)  

**Backend Implementation:**
```
backend/src/main/java/com/smartcampus/
├── auth/
│   ├── controller/AuthController.java        # Auth endpoints
│   ├── service/AuthService.java              # Auth logic
│   ├── service/JwtTokenProvider.java         # JWT generation
│   ├── model/User.java                       # User entity
│   ├── dto/GoogleAuthRequest.java            # OAuth DTO
│   └── dto/LoginRequestDTO.java              # Login DTO
├── user/
│   ├── controller/UserController.java        # User endpoints
│   ├── service/UserService.java              # User logic
│   └── repository/UserRepository.java        # User data
└── notification/
    ├── controller/NotificationController.java # Notification endpoints
    ├── service/NotificationService.java      # Notification logic
    ├── model/Notification.java               # Notification entity
    └── repository/NotificationRepository.java
```

**Frontend Implementation:**
```
frontend/src/
├── context/AuthContext.jsx                   # Auth state
├── hooks/useNotifications.js                 # Notification hook
├── pages/member4/AdminUsersPage.jsx          # User management
├── pages/member3/AdminTechnicianPage.jsx     # Technician mgmt
├── components/notifications/NotificationCenter.jsx
├── components/AuthUnauthorizedBridge.jsx     # Auth flow
└── api/
    ├── authApi.js                            # Auth API
    └── userAdminApi.js                       # User API
```

**Key Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/logout` | Logout (frontend handles) |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/me` | Update profile |
| POST | `/api/auth/register/lecturer` | Register lecturer |
| POST | `/api/auth/register/lecturer/request-otp` | Request OTP |
| POST | `/api/auth/register/lecturer/verify-otp` | Verify OTP |
| GET | `/api/users` | List users (ADMIN) |
| POST | `/api/users` | Create user (ADMIN) |
| PATCH | `/api/users/{id}/role` | Change user role (ADMIN) |
| DELETE | `/api/users/{id}` | Delete user (ADMIN) |
| GET | `/api/technicians` | List technicians |
| POST | `/api/technicians` | Create technician (ADMIN) |
| PUT | `/api/technicians/{id}` | Update technician (ADMIN) |
| DELETE | `/api/technicians/{id}` | Delete technician (ADMIN) |
| GET | `/api/notifications` | Get notifications |
| GET | `/api/notifications/stream` | SSE notification stream |
| PATCH | `/api/notifications/{id}/read` | Mark as read |
| DELETE | `/api/notifications/{id}` | Delete notification |

**🔐 Security Features:**
- JWT tokens with 24-hour expiration
- Bearer token authentication
- Google OAuth 2.0 support
- Password hashing (bcrypt)
- Role-based endpoint authorization
- CORS configuration

**📧 Notification Types:**
1. **Ticket Created** - Notify assignee when ticket created
2. **Technician Assigned** - Notify reporter when assigned
3. **Status Changed** - Notify stakeholders of status updates
4. **Booking Approved** - Confirm booking approval
5. **SLA Warning** - Alert when SLA at risk

**🔔 Notification Channels:**
- **In-App (SSE)**: Real-time notifications via Server-Sent Events
- **Email**: HTML formatted system emails via SMTP
- **User Control**: Per-user preferences for each channel

**Email Templates:**
```
backend/src/main/resources/templates/
├── system-notification-email.html
└── booking-confirmation-email.html
```

---

## 🎯 Features by Module

### **Facility Management (Member 1)**
| Feature | Backend Endpoint | Frontend Page |
|---------|------------------|---------------|
| List all facilities | `GET /api/facilities` | AdminFacilitiesPage |
| Get facility details | `GET /api/facilities/{id}` | AdminFacilitiesPage |
| Create facility | `POST /api/facilities` | AdminFacilitiesPage |
| Update facility | `PUT /api/facilities/{id}` | AdminFacilitiesPage |
| Delete facility | `DELETE /api/facilities/{id}` | AdminFacilitiesPage |
| Update facility status | `PATCH /api/facilities/{id}/status` | AdminFacilitiesPage |
| Search facilities | `GET /api/facilities/search` | AdminFacilitiesPage |

### **Booking Management (Member 2)**
| Feature | Backend Endpoint | Frontend Page |
|---------|------------------|---------------|
| Create booking | `POST /api/bookings` | CreateBookingPage |
| List my bookings | `GET /api/bookings/my` | AdminBookingsPage |
| Get booking details | `GET /api/bookings/{id}` | AdminReviewBookingPage |
| Check availability | `GET /api/bookings/check-availability` | CreateBookingPage |
| Approve booking | `POST /api/bookings/{id}/approve` | AdminReviewBookingPage |
| Reject booking | `POST /api/bookings/{id}/reject` | AdminReviewBookingPage |
| Cancel booking | `POST /api/bookings/{id}/cancel` | AdminBookingsPage |
| Get analytics | `GET /api/bookings/analytics` | AdminAnalyticsPage ⭐ |
| Public scanner API | `GET /api/bookings/public/{id}` | Mobile Scanners |

### **Maintenance & Tickets (Member 3)**
| Feature | Backend Endpoint | Frontend Page |
|---------|------------------|---------------|
| Create ticket | `POST /api/tickets` | CreateTicketPage |
| List all tickets | `GET /api/tickets` | AdminTicketsPage |
| Get my tickets | `GET /api/tickets/my` | MyTicketsPage |
| Get ticket details | `GET /api/tickets/{id}` | TicketDetailPage |
| Update ticket status | `PATCH /api/tickets/{id}/status` | TicketDetailPage |
| Assign technician | `POST /api/tickets/{id}/assign` | TicketDetailPage |
| Delete ticket | `DELETE /api/tickets/{id}` | AdminTicketsPage |
| Get technician stats | `GET /api/tickets/performance` | AdminTicketStatsPage |
| Export to CSV | `GET /api/tickets/export` | AdminTicketsPage |
| Upload attachment | `POST /api/tickets/{id}/attachments` | CreateTicketPage |
| Download attachment | `GET /api/tickets/{id}/attachments/{name}` | TicketDetailPage |
| Add comment | `POST /api/tickets/{id}/comments` | TicketDetailPage |
| Get comments | `GET /api/tickets/{id}/comments` | TicketDetailPage |
| **SLA Timer Display** | Calculated in component | TicketCard/DetailPage ⭐ |

### **Authentication & Notifications (Member 4)**
| Feature | Backend Endpoint | Frontend Page |
|---------|------------------|---------------|
| Google OAuth login | `POST /api/auth/google` | LoginPage |
| Email/password login | `POST /api/auth/login` | LoginPage |
| Get current user | `GET /api/auth/me` | AppShell |
| Update profile | `PATCH /api/auth/me` | ProfilePage |
| Register technician | `POST /api/auth/register/technician` | AdminTechnicianPage |
| List users | `GET /api/users` | AdminUsersPage |
| Change user role | `PATCH /api/users/{id}/role` | AdminUsersPage |
| List technicians | `GET /api/technicians` | TechnicianSelectModal |
| Create technician | `POST /api/technicians` | AdminTechnicianPage |
| Update technician | `PUT /api/technicians/{id}` | AdminTechnicianPage |
| Delete technician | `DELETE /api/technicians/{id}` | AdminTechnicianPage |
| Get notifications | `GET /api/notifications` | NotificationCenter |
| Subscribe to notifications | `GET /api/notifications/stream` | useNotifications hook |
| Mark as read | `PATCH /api/notifications/{id}/read` | NotificationCenter |

---

## Project Structure

```
smart-campus/
├── backend/                              # Spring Boot 3.x REST API
│   ├── src/main/java/com/smartcampus/
│   │   ├── auth/                         # Member 4: Authentication
│   │   │   ├── controller/AuthController.java
│   │   │   ├── service/AuthService.java
│   │   │   ├── service/JwtTokenProvider.java
│   │   │   ├── model/User.java
│   │   │   └── dto/
│   │   ├── booking/                      # Member 2: Bookings
│   │   │   ├── controller/BookingController.java
│   │   │   ├── service/BookingService.java
│   │   │   ├── util/QrCodeGenerator.java
│   │   │   ├── model/Booking.java
│   │   │   └── dto/
│   │   ├── facilities/                   # Member 1: Facilities
│   │   │   ├── controller/FacilityController.java
│   │   │   ├── service/FacilityService.java
│   │   │   ├── model/Facility.java
│   │   │   └── dto/FacilityDto.java
│   │   ├── maintenance/                  # Member 3: Tickets & SLA
│   │   │   ├── controller/TicketController.java
│   │   │   ├── controller/CommentController.java
│   │   │   ├── service/TicketServiceImpl.java
│   │   │   ├── service/AttachmentService.java
│   │   │   ├── service/SupabaseStorageService.java
│   │   │   ├── policy/SlaPolicy.java
│   │   │   ├── job/SlaEscalationJob.java
│   │   │   ├── model/Ticket.java
│   │   │   ├── model/Attachment.java
│   │   │   └── dto/TicketResponseDTO.java
│   │   ├── notification/                 # Member 4: Notifications
│   │   │   ├── controller/NotificationController.java
│   │   │   ├── service/NotificationService.java
│   │   │   ├── model/Notification.java
│   │   │   └── dto/
│   │   ├── user/                         # Member 4: Users & Roles
│   │   │   ├── controller/UserController.java
│   │   │   ├── service/UserService.java
│   │   │   └── repository/UserRepository.java
│   │   ├── config/                       # Spring configuration
│   │   ├── exception/                    # Exception handlers
│   │   └── util/                         # Utilities
│   ├── src/main/resources/
│   │   ├── application.properties        # Configuration
│   │   ├── schema.sql                    # Database schema
│   │   └── templates/                    # Email templates
│   ├── src/test/java/                    # Unit & integration tests
│   ├── pom.xml                           # Maven dependencies
│   ├── API_DOCUMENTATION.md              # API reference
│   ├── AUTHENTICATION.md                 # Auth details
│   └── mvnw / mvnw.cmd                   # Maven wrapper
│
├── frontend/                             # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/
│   │   │   ├── authApi.js                # Auth API client
│   │   │   ├── ticketApi.js              # Ticket API client
│   │   │   ├── bookingApi.js             # Booking API client
│   │   │   ├── facilityApi.js            # Facility API client
│   │   │   ├── userAdminApi.js           # User management API
│   │   │   └── notificationsApi.js       # Notifications API
│   │   ├── components/
│   │   │   ├── SlaTimer.jsx              # INNOVATION: Real-time SLA
│   │   │   ├── SLAStatusBadge.jsx        # SLA status badge
│   │   │   ├── ImageUploadZone.jsx       # File upload
│   │   │   ├── TicketAttachmentImage.jsx # Attachment display
│   │   │   ├── CommentThread.jsx         # Comments UI
│   │   │   ├── dashboard/                # Dashboard components
│   │   │   ├── notifications/            # Notification UI
│   │   │   └── ...                       # Other components
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Auth state
│   │   ├── hooks/
│   │   │   ├── useNotifications.js       # SSE hook
│   │   │   └── useTicketUpdates.js       # Real-time updates
│   │   ├── layouts/
│   │   │   └── AppShell.jsx              # Main layout
│   │   ├── pages/
│   │   │   ├── member1/AdminFacilitiesPage.jsx
│   │   │   ├── member2/
│   │   │   │   ├── AdminBookingsPage.jsx
│   │   │   │   ├── AdminReviewBookingPage.jsx
│   │   │   │   └── AdminAnalyticsPage.jsx
│   │   │   ├── member3/
│   │   │   │   ├── CreateTicketPage.jsx
│   │   │   │   ├── AdminTicketsPage.jsx
│   │   │   │   ├── TicketDetailPage.jsx
│   │   │   │   ├── AdminTicketStatsPage.jsx
│   │   │   │   └── MyTicketsPage.jsx
│   │   │   └── member4/AdminUsersPage.jsx
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── RoleProtectedDashboard.jsx
│   │   ├── utils/
│   │   │   ├── formatDate.js
│   │   │   ├── ticketStatsAggregates.js
│   │   │   └── ticketStatusDisplay.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── DEVELOPMENT_SETUP.md                  # Local setup guide
├── DEPLOYMENT.md                         # Production deployment
├── TROUBLESHOOTING.md                    # Common issues
└── README.md                             # This file
```

---

## Technology Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Spring Boot** | 3.2.x | REST API framework |
| **Spring Security** | Latest | Authentication & authorization |
| **Spring Data JPA** | Latest | Database ORM |
| **PostgreSQL** | 14+ | Relational database |
| **JWT (jjwt)** | Latest | Token-based auth |
| **Lombok** | Latest | Code generation |
| **JUnit 5** | Latest | Unit testing |
| **Mockito** | Latest | Mocking library |
| **Google ZXing** | 1.x | QR code generation |
| **Supabase SDK** | REST | Cloud storage |
| **Springfox / Swagger** | Latest | API documentation |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.x | UI framework |
| **Vite** | Latest | Build tool |
| **Tailwind CSS** | 3.x | Styling |
| **Axios** | Latest | HTTP client |
| **React Query** | Latest | Data fetching |
| **React Router** | 6.x | Client-side routing |
| **Lucide Icons** | Latest | Icon library |
| **React Dropzone** | Latest | File uploads |
| **Vitest** | Latest | Unit testing |

---

## Prerequisites

| Requirement | Version | Notes |
|------------|---------|-------|
| **JDK** | 17+ | Required for Spring Boot 3.x |
| **Node.js** | 18+ | For Vite + React |
| **npm** | 9+ | Package manager |
| **PostgreSQL** | 14+ | Database server |
| **Git** | Latest | Version control |

**Verify Installation:**
```bash
java -version        # Should show 17+
node -v             # Should show 18+
npm -v              # Should show 9+
psql --version      # Should show 14+
```

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/smart-campus.git
cd smart-campus
```

### 2. Backend Setup

**Install Maven Dependencies:**
```bash
cd backend
./mvnw -q clean compile    # Linux/macOS
.\mvnw.cmd -q clean compile # Windows
```

**Configure Database:**
Create a `.env` file in `backend/` or set environment variables:
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/smart_campus
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
```

**Or edit `application.properties`:**
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/smart_campus
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

**Configure Supabase (Optional):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
supabase.bucket=ticket-attachments
```

**Configure SMTP (Optional):**
```env
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-email@gmail.com
SPRING_MAIL_PASSWORD=app_password
APP_MAIL_ENABLED=true
APP_MAIL_FROM=your-email@gmail.com
```

### 3. Frontend Setup

**Install npm Dependencies:**
```bash
cd frontend
npm install
```

**Configure API Base URL** (in `frontend/src/api/axiosInstance.js`):
```javascript
const baseURL = process.env.VITE_API_URL || 'http://localhost:8081/api';
```

**Create `.env` if needed:**
```env
VITE_API_URL=http://localhost:8081/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

## Running the Application

### Start Backend
```bash
cd backend

# Windows
.\mvnw.cmd spring-boot:run

# Linux/macOS
./mvnw spring-boot:run
```

Backend will be available at: **http://localhost:8081**  
Swagger UI: **http://localhost:8081/swagger-ui.html**

### Start Frontend
```bash
cd frontend
npm run dev
```

Frontend will be available at: **http://localhost:5173**

### Access the Application
1. Open **http://localhost:5173** in your browser
2. Sign in with Google or email/password
3. Navigate to your dashboard based on role

---

## API Endpoints Summary

### **Authentication Endpoints**
```
POST   /api/auth/google                    Google OAuth login
POST   /api/auth/login                     Email/password login
GET    /api/auth/me                        Get current user
PATCH  /api/auth/me                        Update profile
POST   /api/auth/logout                    Logout
```

### **Facility Endpoints**
```
GET    /api/facilities                     List facilities
POST   /api/facilities                     Create facility (ADMIN)
GET    /api/facilities/{id}                Get facility details
PUT    /api/facilities/{id}                Update facility (ADMIN)
PATCH  /api/facilities/{id}/status         Update status (ADMIN)
DELETE /api/facilities/{id}                Delete facility (ADMIN)
```

### **Booking Endpoints**
```
POST   /api/bookings                       Create booking
GET    /api/bookings/my                    Get user's bookings
GET    /api/bookings                       List all bookings (ADMIN)
GET    /api/bookings/{id}                  Get booking details
GET    /api/bookings/check-availability    Check availability
POST   /api/bookings/{id}/approve          Approve (ADMIN)
POST   /api/bookings/{id}/reject           Reject (ADMIN)
POST   /api/bookings/{id}/cancel           Cancel
GET    /api/bookings/analytics             Get analytics (ADMIN)
GET    /api/bookings/public/{id}           Public scanner API
```

### **Ticket Endpoints**
```
POST   /api/tickets                        Create ticket
GET    /api/tickets                        List tickets (ADMIN/TECH)
GET    /api/tickets/my                     Get user's tickets
GET    /api/tickets/{id}                   Get ticket details
PATCH  /api/tickets/{id}/status            Update status
POST   /api/tickets/{id}/assign            Assign technician (ADMIN)
DELETE /api/tickets/{id}                   Delete ticket (ADMIN)
GET    /api/tickets/performance            Technician stats (ADMIN)
GET    /api/tickets/export                 Export to CSV (ADMIN)
POST   /api/tickets/{id}/attachments       Upload file
GET    /api/tickets/{id}/attachments/{name} Download file
POST   /api/tickets/{id}/comments          Add comment
GET    /api/tickets/{id}/comments          Get comments
```

### **User Endpoints**
```
GET    /api/users                          List users (ADMIN)
POST   /api/users                          Create user (ADMIN)
PATCH  /api/users/{id}/role                Change role (ADMIN)
DELETE /api/users/{id}                     Delete user (ADMIN)
GET    /api/technicians                    List technicians
POST   /api/technicians                    Create technician (ADMIN)
PUT    /api/technicians/{id}               Update technician (ADMIN)
DELETE /api/technicians/{id}               Delete technician (ADMIN)
```

### **Notification Endpoints**
```
GET    /api/notifications                  Get notifications
GET    /api/notifications/stream           SSE stream
PATCH  /api/notifications/{id}/read        Mark as read
DELETE /api/notifications/{id}             Delete notification
```

---

## Environment Configuration

### Backend Properties

**Database:**
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/smart_campus
spring.datasource.username=postgres
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
```

**JWT:**
```properties
app.jwt.secret=your-very-secret-key-min-32-chars
app.jwt.expiration=86400000  # 24 hours in milliseconds
```

**Google OAuth:**
```properties
app.oauth.google.client-id=your-client-id.apps.googleusercontent.com
app.oauth.google.client-secret=your-client-secret
```

**Email/SMTP:**
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

**Supabase:**
```properties
supabase.url=https://your-project.supabase.co
supabase.service-key=your-service-key
supabase.bucket=ticket-attachments
```

### Frontend Environment

Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:8081/api
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_ENV=development
```

---

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=TicketServiceTest

# With coverage
./mvnw test jacoco:report
```

**Test Files:**
- `backend/src/test/java/com/smartcampus/maintenance/service/TicketServiceTest.java`
- `backend/src/test/java/com/smartcampus/maintenance/controller/TicketControllerIntegrationTest.java`
- `backend/src/test/java/com/smartcampus/booking/service/BookingServiceTest.java`
- etc.

### Frontend Tests
```bash
cd frontend

# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

**Test Files:**
- `frontend/src/components/SlaTimer.test.jsx`
- `frontend/src/components/ImageLightbox.test.jsx`
- etc.

---

## Documentation

| Document | Purpose |
|----------|---------|
| `backend/API_DOCUMENTATION.md` | Complete API reference with examples |
| `backend/AUTHENTICATION.md` | OAuth flow, JWT, role-based auth |
| `DEVELOPMENT_SETUP.md` | Detailed development environment setup |
| `DEPLOYMENT.md` | Production deployment guide |
| `TROUBLESHOOTING.md` | Common issues and solutions |
| This `README.md` | Project overview and quick start |

---

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check PostgreSQL is running: `psql -U postgres -d smart_campus`
- Verify `application.properties` database URL
- Check port 8081 is available: `lsof -i :8081`

**Frontend won't load:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules/` and run `npm install` again
- Check API URL in environment variables
- Verify backend is running

**Supabase uploads failing:**
- Verify credentials in `.env`
- Check bucket exists in Supabase console
- Ensure bucket is public or has proper permissions

**Email notifications not sending:**
- Enable "Less secure app access" if using Gmail
- Use App Password instead of account password
- Check SMTP configuration in `application.properties`

**SSE notifications not streaming:**
- Check browser console for CORS errors
- Verify API URL in frontend config
- Restart backend service

For more detailed troubleshooting, see `TROUBLESHOOTING.md`.

---

## Contributing

Each member is responsible for their module:

| Member | Module | Responsibility |
|--------|--------|-----------------|
| Member 1 | Facilities | CRUD, filtering, status management |
| Member 2 | Bookings | Reservations, QR codes, analytics |
| Member 3 | Maintenance | Tickets, SLA, attachments, comments |
| Member 4 | Auth & Notifications | JWT, roles, notifications, email |

---

## License

This project is part of the PAF (Professional Application Framework) course at the University of Colombo School of Computing.

---

## Contact & Support

For issues, questions, or contributions, please contact:
- **Project Coordinator**: [Your Name]
- **Technical Lead**: [Your Name]

---

**Last Updated**: April 2026  
**Version**: 1.0.0
