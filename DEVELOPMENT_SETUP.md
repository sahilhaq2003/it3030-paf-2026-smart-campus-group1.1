# Development Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Running the Application](#running-the-application)
7. [Development Tools](#development-tools)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **OS:** Windows, macOS, or Linux
- **Disk Space:** 5 GB minimum
- **RAM:** 8 GB minimum (16 GB recommended)
- **Internet:** Required for dependencies and services

### Required Software

#### 1. Java Development Kit (JDK)
- **Version:** JDK 17 or later
- **Download:** https://www.oracle.com/java/technologies/downloads/

**Installation:**
```bash
# Windows
# Download and run installer from Oracle
# Or use package manager:
choco install openjdk

# macOS
brew install openjdk@17

# Linux
sudo apt-get install openjdk-17-jdk
```

**Verify Installation:**
```bash
java -version
javac -version
```

#### 2. Maven
- **Version:** 3.9.0 or later
- **Download:** https://maven.apache.org/download.cgi

**Installation:**
```bash
# Extract to desired location
unzip apache-maven-3.9.0-bin.zip

# Add bin to PATH
export PATH=$PATH:/path/to/apache-maven-3.9.0/bin

# macOS
brew install maven

# Linux
sudo apt-get install maven
```

**Verify Installation:**
```bash
mvn --version
```

#### 3. Node.js & npm
- **Version:** Node.js 18+ with npm 9+
- **Download:** https://nodejs.org/

**Installation:**
```bash
# Windows - use installer from nodejs.org
# Or package manager:
choco install nodejs

# macOS
brew install node

# Linux
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify Installation:**
```bash
node --version
npm --version
```

#### 4. Git
- **Version:** 2.30+
- **Download:** https://git-scm.com/

**Installation:**
```bash
# Windows
choco install git

# macOS
brew install git

# Linux
sudo apt-get install git
```

**Verify Installation:**
```bash
git --version
```

#### 5. IDE/Editor (Choose one)
- **IntelliJ IDEA Community Edition** (recommended for backend)
  - Download: https://www.jetbrains.com/idea/download/
  
- **VS Code** (recommended for frontend)
  - Download: https://code.visualstudio.com/
  - Extensions: ES7+ React/Redux/React-Native snippets, Tailwind CSS IntelliSense

- **Spring Tool Suite (STS)**
  - Download: https://spring.io/tools

---

## Backend Setup

### Step 1: Clone Repository

```bash
cd your-workspace-directory
git clone <repository-url>
cd smart-campus/backend
```

### Step 2: Install Dependencies

```bash
mvn clean install
```

This will download all Maven dependencies specified in pom.xml.

### Step 3: Verify Build

```bash
mvn clean package -DskipTests
```

Expected output:
```
[INFO] BUILD SUCCESS
[INFO] Total time: X.XXs
[INFO] Finished at: 2026-03-29T10:30:00Z
```

### Step 4: Configure application.properties

See [Environment Configuration](#environment-configuration) section.

### Step 5: Run Backend Server

**Option A: Using Maven**
```bash
mvn spring-boot:run
```

**Option B: Using IDE**
1. Open project in IntelliJ IDEA
2. Right-click main class (SmartCampusApplication) → Run

**Option C: Using JAR**
```bash
java -jar target/smart-campus-1.0.0.jar
```

**Expected Output:**
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| ._ \_| |_|_| |_|\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.x.x)

2026-03-29 10:30:00.xxx  INFO 12345 --- [           main] c.s.SmartCampusApplication              : Starting SmartCampusApplication
2026-03-29 10:30:03.xxx  INFO 12345 --- [           main] c.s.SmartCampusApplication              : Started SmartCampusApplication in 2.5 seconds (JVM running for 3.2s)
```

---

## Frontend Setup

### Step 1: Navigate to Frontend

```bash
cd smart-campus/frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all packages from package.json.

### Step 3: Create Environment File

Create `.env.local` in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Step 4: Run Development Server

```bash
npm run dev
```

**Expected Output:**
```
  VITE v4.5.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Step 5: Open in Browser

Navigate to `http://localhost:5173/`

---

## Database Setup

### Option 1: Using Docker (Recommended)

**Prerequisites:**
- Docker installed: https://www.docker.com/

**Steps:**
```bash
# Start MySQL container
docker run --name mysql-smartcampus \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=smartcampus \
  -e MYSQL_PASSWORD=password \
  -p 3306:3306 \
  -d mysql:8.0
```

### Option 2: Local MySQL Installation

1. Download MySQL: https://dev.mysql.com/downloads/mysql/
2. Install following official guide
3. Create database:

```sql
CREATE DATABASE smartcampus;
CREATE USER 'smartcampus'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON smartcampus.* TO 'smartcampus'@'localhost';
FLUSH PRIVILEGES;
```

### Option 3: Database Connection String

Add to `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smartcampus
spring.datasource.username=smartcampus
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update
```

---

## Environment Configuration

### Backend Configuration

Create/update `backend/src/main/resources/application.properties`:

```properties
# Server
server.port=8080
server.servlet.context-path=/

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/smartcampus
spring.datasource.username=smartcampus
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# JWT Configuration
jwt.secret=your-secret-key-minimum-32-characters-for-hs256
jwt.expiration=86400000

# Google OAuth
google.client-id=your-google-client-id.apps.googleusercontent.com
google.client-secret=your-google-client-secret

# File Upload
file.upload.dir=/uploads
file.max-size=10485760

# CORS
cors.allowed-origins=http://localhost:5173,http://localhost:3000
cors.allowed-methods=GET,POST,PATCH,DELETE,OPTIONS
cors.allowed-headers=Authorization,Content-Type

# Logging
logging.level.root=INFO
logging.level.com.smartcampus=DEBUG

# Swagger/OpenAPI
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
```

### Frontend Configuration

Create `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_LOGR_LEVEL=debug
```

### Environment Variables for Production

**Backend (.env file):**
```
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=smartcampus
DB_USER=user
DB_PASSWORD=password
JWT_SECRET=your-very-long-secret-key-here
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
UPLOAD_DIR=/var/smartcampus/uploads
```

**Frontend (.env.production):**
```
VITE_API_BASE_URL=https://api.smartcampus.edu
VITE_GOOGLE_CLIENT_ID=production-client-id
```

---

## Running the Application

### Development Mode (Full Stack)

**Terminal 1 - Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui.html
- API Docs: http://localhost:8080/api-docs

### Production Build

**Backend:**
```bash
cd backend
mvn clean package
java -jar target/smart-campus-1.0.0.jar
```

**Frontend:**
```bash
cd frontend
npm run build
# Serves from dist/ directory
npm run preview
```

---

## Development Tools

### Backend Development

#### Maven Commands

```bash
# Install dependencies
mvn install

# Run tests
mvn test

# Run specific test class
mvn test -Dtest=TicketServiceTest

# Build without running tests
mvn clean package -DskipTests

# View dependency tree
mvn dependency:tree

# Check for update versions
mvn versions:display-dependency-updates
```

#### IntelliJ IDEA Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Space` | Autocomplete |
| `Ctrl+/` | Toggle comment |
| `Alt+Enter` | Quick fix |
| `Ctrl+Shift+T` | Go to test |
| `Ctrl+D` | Duplicate line |
| `Ctrl+H` | Find and replace |

#### Debugging

1. Set breakpoint by clicking line number
2. Click Debug button
3. Use Debug panel to:
   - Step through code (F10)
   - Step into functions (F11)
   - Continue execution (F9)
   - Evaluate expressions (Alt+F9)

### Frontend Development

#### npm Scripts

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

#### Useful VS Code Extensions

```
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint
- GitLens
- Thunder Client (API testing)
```

### Testing

#### Backend Unit Tests

```bash
cd backend
mvn test

# Run specific test class
mvn test -Dtest=TicketServiceTest

# Run with coverage
mvn clean test jacoco:report
# Open: target/site/jacoco/index.html
```

#### Frontend Component Tests

```bash
cd frontend
npm run test

# Watch mode
npm run test -- --watch

# Coverage report
npm run test -- --coverage
```

### API Testing

#### Using cURL

```bash
# Get tickets
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/tickets

# Create ticket
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"New issue"}' \
  http://localhost:8080/api/tickets
```

#### Using Thunder Client (VS Code)

1. Install "Thunder Client" extension
2. Create new request
3. Fill in endpoint details
4. Set headers: `Authorization: Bearer <token>`
5. Send request

#### Using Postman

1. Download: https://www.postman.com/
2. Import API collection from Swagger UI
3. Set up environment variables (token, base URL)
4. Test endpoints

---

## Troubleshooting

### Backend Issues

#### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Or change port in application.properties
server.port=8081
```

#### Database Connection Error

```
ERROR: Cannot connect to database
```

**Solutions:**
1. Verify MySQL is running
2. Check connection string in application.properties
3. Verify database and user exist
4. Check firewall settings

#### Maven Build Fails

```bash
# Clear cache and rebuild
mvn clean
rm -rf ~/.m2/repository
mvn install
```

#### Out of Memory

```bash
# Increase heap size before running
export MAVEN_OPTS="-Xmx2048m"
mvn spring-boot:run
```

### Frontend Issues

#### Port Already in Use

```bash
# Change port in vite.config.js
export default {
  server: {
    port: 5174
  }
}
```

#### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules

# Reinstall
npm install
```

#### CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solutions:**
1. Check CORS configuration in backend
2. Verify frontend URL is in `cors.allowed-origins`
3. Ensure Authorization header is sent

#### Vite Hot Reload Not Working

```bash
# Check vite.config.js has:
export default {
  server: {
    hmr: {
      host: 'localhost',
      port: 5173
    }
  }
}
```

### Database Issues

#### Tables Not Created

```java
// In application.properties, use:
spring.jpa.hibernate.ddl-auto=create-drop  // development
spring.jpa.hibernate.ddl-auto=update       // production
```

#### Migration Issues

```bash
# Reset database
DROP DATABASE smartcampus;
CREATE DATABASE smartcampus;

# Spring will recreate schema on startup
```

### Google OAuth Issues

#### "Popup blocked" Error

- Ensure Google OAuth happens on user gesture (click)
- Check browser's popup blocker settings

#### "Invalid Client ID" Error

1. Verify client ID in .env matches Google Console
2. Add localhost:3000 and localhost:5173 to authorized origins
3. Clear browser cookies and try again

### General Debugging

#### Check Logs

**Backend:**
```bash
# Tail logs
tail -f /var/log/smartcampus/app.log

# Search for errors
grep ERROR /var/log/smartcampus/app.log
```

**Frontend:**
```bash
# Open browser console (F12)
# Check Application → Local Storage
# View Network tab for API calls
```

#### Network Debugging

```bash
# Capture API traffic
curl -v http://localhost:8080/api/tickets

# Use Charles Proxy or Fiddler for GUI capture
```

---

## Next Steps

1. Complete environment setup using steps above
2. Run both backend and frontend in development mode
3. Access http://localhost:5173 in browser
4. Review [API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md) for available endpoints
5. Review [AUTHENTICATION.md](./backend/AUTHENTICATION.md) for auth implementation
6. Start development!

---

For additional help, see:
- Backend: [README.md](./backend/README.md)
- Frontend: [Frontend Structure](#) in your project
- API Docs: http://localhost:8080/swagger-ui.html (when running)
