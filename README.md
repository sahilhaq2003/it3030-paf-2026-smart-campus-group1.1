# Smart Campus 

A comprehensive full-stack application for managing facility maintenance requests and tickets at Smart Campus. The system includes a Spring Boot REST API backend and a modern React frontend.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Starting the Application](#starting-the-application)
- [Database Configuration](#database-configuration)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [API Documentation](#api-documentation)

---

## 📱 Project Overview

Smart Campus Maintenance System is designed to streamline facility maintenance operations through:
- **Ticket Management**: Create, track, and manage maintenance tickets
- **User Roles**: Support for different user roles (Admin, Technician, Member)
- **File Attachments**: Attach multiple files to maintenance tickets
- **Comments & Updates**: Track ticket progress through comments
- **Automated Scheduling**: Task scheduling and timeout management
- **Facility Management**: Organize and manage campus facilities

---

## 🗂️ Project Structure

```
smart-campus/
│
├── backend/                          # Spring Boot REST API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/smartcampus/
│   │   │   │   ├── auth/             # Authentication & Authorization
│   │   │   │   │   └── model/
│   │   │   │   ├── facilities/       # Facility Management
│   │   │   │   │   ├── model/
│   │   │   │   │   └── repository/
│   │   │   │   ├── maintenance/     # Core Maintenance Module
│   │   │   │   │   ├── config/
│   │   │   │   │   ├── controller/
│   │   │   │   │   ├── dto/
│   │   │   │   │   ├── event/
│   │   │   │   │   ├── model/
│   │   │   │   │   ├── repository/
│   │   │   │   │   ├── scheduler/
│   │   │   │   │   └── service/
│   │   │   │   └── user/             # User Management
│   │   │   │       ├── model/
│   │   │   │       └── repository/
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/                     # Unit Tests
│   ├── pom.xml                       # Maven Dependencies
│   └── mvnw.cmd                      # Maven Wrapper
│
├── frontend/                         # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/                      # API Integration
│   │   │   ├── axiosInstance.js
│   │   │   └── ticketApi.js
│   │   ├── components/               # Reusable Components
│   │   │   ├── AppLayout.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── PageContainer.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── context/                  # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/                    # Page Components
│   │   │   └── member3/
│   │   │       ├── AdminTicketsPage.jsx
│   │   │       ├── CreateTicketPage.jsx
│   │   │       ├── MyTicketsPage.jsx
│   │   │       ├── TechnicianDashboard.jsx
│   │   │       └── TicketDetailPage.jsx
│   │   ├── utils/                    # Utility Functions
│   │   │   └── formatDate.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
│
└── README.md                         # This File
```

---

## ✅ Prerequisites

### Required Software

- **Java Development Kit (JDK) 17+**
  - Download: https://www.oracle.com/java/technologies/javase-downloads.html
  - Verify: `java -version`

- **Node.js 16+ and npm**
  - Download: https://nodejs.org/
  - Verify: `node -v` and `npm -v`

- **MySQL 8.0+**
  - Download: https://dev.mysql.com/downloads/mysql/
  - Must be running before starting the backend

- **Maven** (Included with the project via `mvnw.cmd`)

---

## 🚀 Installation

### Step 1: Clone/Extract the Project

```bash
cd smart-campus
```

### Step 2: Backend Setup

```bash
cd backend
# No need to install anything separately - Maven handles dependencies
# Target framework: Spring Boot 3.2.5 with Java 17
```

### Step 3: Frontend Setup

```bash
cd frontend
npm install  # Install all dependencies (React, Vite, Tailwind CSS, etc.)
```

---

## 🎯 Starting the Application

### Start Backend (REST API)

```bash
cd backend

# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

**Backend URL**: http://localhost:8081
**Swagger UI**: http://localhost:8081/swagger-ui.html

### Start Frontend (React App)

```bash
cd frontend

# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Frontend URL**: http://localhost:5173

### ⚠️ Important: Database Must Be Running

The backend requires MySQL to be running before starting. Ensure:
1. MySQL service is running on your system
2. Database connection details match `backend/src/main/resources/application.properties`

---

## 🔧 Database Configuration

### Default Configuration

```properties
Database Host: localhost
Database Port: 3306
Database Name: smart_campus_db
Username: campus_user
Password: campus123
```

### Create Database and User

Connect to MySQL and run:

```sql
-- Create Database
CREATE DATABASE smart_campus_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create User
CREATE USER 'campus_user'@'localhost' IDENTIFIED BY 'campus123';

-- Grant Privileges
GRANT ALL PRIVILEGES ON smart_campus_db.* TO 'campus_user'@'localhost';
FLUSH PRIVILEGES;
```

### Automatic Table Creation

Tables are automatically created on first startup via Hibernate (configured in `application.properties`).

---

## ✨ Key Features

### Authentication & Authorization
- User authentication via Spring Security
- JWT Token support prepared (configured in `application.properties`)
- Role-based access control

### Ticket Management
- Create new maintenance tickets
- Track ticket status and progress
- Assign tickets to technicians
- Add comments and updates
- Attach multiple files to tickets

### User Management
- Admin users for system management
- Technician users for ticket handling
- Member/Regular users for ticket creation

### Facility Management
- Manage campus facilities
- Link tickets to facilities
- Track facility maintenance history

### UI Features
- Responsive design with Tailwind CSS
- Real-time data updates via React Query
- File upload with drag-and-drop
- Modal dialogs for confirmations
- Data tables with pagination

---

## 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Spring Boot | 3.2.5 | Web Framework & REST API |
| Spring Security | Latest | Authentication & Authorization |
| Spring Data JPA | Latest | Database Access & ORM |
| MySQL | 8.0+ | Relational Database |
| Maven | 3.6+ | Dependency Management |
| Swagger/OpenAPI | 2.3.0 | API Documentation |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.4 | UI Framework |
| Vite | 7.3.1+ | Build Tool & Dev Server |
| Tailwind CSS | 4.2.1 | Styling Framework |
| React Query (TanStack) | 5.90.21 | Server State Management |
| Axios | 1.13.6 | HTTP Client |
| React Hook Form | 5.2.2 | Form Management |
| React Dropzone | 15.0.0 | File Upload |

---

## 📚 API Documentation

Once the backend is running, access interactive API documentation:

**Swagger UI**: http://localhost:8081/swagger-ui.html

Main API endpoints include:
- `/api/tickets` - Ticket management
- `/api/comments` - Comments on tickets
- `/api/facilities` - Facility data
- `/api/users` - User management

---

## 📝 Configuration Files

### Backend Configuration
- **Main Config**: `backend/src/main/resources/application.properties`
  - Server port: 8081
  - Database connection
  - JWT configuration
  - File upload settings
  - Swagger UI settings

- **Security Config**: `backend/src/main/java/com/smartcampus/maintenance/config/SecurityConfig.java`
  - Spring Security configuration
  - CORS settings
  - Authentication filters

### Frontend Configuration
- **Vite Config**: `frontend/vite.config.js`
- **Tailwind Config**: `frontend/tailwind.config.js`
- **PostCSS Config**: `frontend/postcss.config.js`
- **API Instance**: `frontend/src/api/axiosInstance.js` (API base URL)

---

## 🐛 Troubleshooting

### Backend Issues

**"Connection refused" error**
- Ensure MySQL is running
- Check database credentials in `application.properties`

**Port 8081 already in use**
- Change `server.port` in `application.properties`
- Or kill the process using port 8081

**Maven build errors**
- Delete `backend/target` directory
- Run `mvnw.cmd clean install`

### Frontend Issues

**"vite is not recognized" error**
- Run `npm install` in the frontend directory
- Ensure Node.js is installed

**Module not found errors**
- Delete `frontend/node_modules` directory
- Run `npm install` again

**Port 5173 already in use**
- Edit `frontend/vite.config.js` to change the port

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation at http://localhost:8081/swagger-ui.html
3. Check backend logs for error messages
4. Review browser console for frontend errors

---

## 📄 License

This project is part of the Smart Campus initiative. All rights reserved by the project team.

---

**Last Updated**: March 7, 2026
