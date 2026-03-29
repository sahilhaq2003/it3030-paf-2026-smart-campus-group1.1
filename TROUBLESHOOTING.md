# Troubleshooting Guide

## Table of Contents
1. [Backend Issues](#backend-issues)
2. [Frontend Issues](#frontend-issues)
3. [Database Issues](#database-issues)
4. [Authentication Issues](#authentication-issues)
5. [Deployment Issues](#deployment-issues)
6. [Performance Issues](#performance-issues)
7. [Common Error Messages](#common-error-messages)
8. [Getting Help](#getting-help)

---

## Backend Issues

### Application Won't Start

**Symptoms:**
```
Application failed to start
Port 8080 is already in use
```

**Solutions:**

1. **Check if port is in use:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8080
kill -9 <PID>
```

2. **Change port temporarily:**
```properties
# application.properties
server.port=8081
```

3. **Check Java installation:**
```bash
java -version
javac -version
```

---

### Maven Build Fails

**Symptoms:**
```
[ERROR] BUILD FAILURE
[ERROR] COMPILATION ERROR
```

**Common Causes and Solutions:**

1. **Java version mismatch:**
```bash
# Check current version
java -version

# Verify JDK 17+ is installed
# If not: Install from https://www.oracle.com/java/technologies/downloads/

# Use correct Java
export JAVA_HOME=/path/to/jdk-17
```

2. **Dependency download issues:**
```bash
# Clear Maven cache
rm -rf ~/.m2/repository

# Try again with offline-mode disabled
mvn clean install -o-
```

3. **Memory issues:**
```bash
# Increase Maven heap
export MAVEN_OPTS="-Xmx2048m -Xms512m"
mvn clean install
```

4. **Locked dependencies:**
```bash
# Remove lock files
rm -rf ~/.m2/repository.lock
```

---

### Database Connection Error

**Symptoms:**
```
ERROR: Cannot connect to database
com.mysql.cj.jdbc.exceptions.CommunicationsException: Communications link failure
```

**Solutions:**

1. **Verify MySQL is running:**
```bash
# Windows
sc query MySQL80

# Linux
sudo systemctl status mysql

# If not running:
# Windows: net start MySQL80
# Linux: sudo systemctl start mysql
```

2. **Check connection string:**
```properties
# Verify in application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/smartcampus
spring.datasource.username=smartcampus
spring.datasource.password=password
```

3. **Test connection manually:**
```bash
mysql -u smartcampus -p password -h localhost smartcampus
```

4. **Verify user permissions:**
```sql
GRANT ALL PRIVILEGES ON smartcampus.* TO 'smartcampus'@'localhost';
FLUSH PRIVILEGES;
```

---

### Tests Fail Locally

**Symptoms:**
```
[ERROR] Tests run: 5, Failures: 2, Errors: 1
```

**Solutions:**

1. **Check test database:**
```properties
# application-test.properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.jpa.hibernate.ddl-auto=create-drop
```

2. **Run single test:**
```bash
mvn test -Dtest=TicketServiceTest
```

3. **Skip tests temporarily:**
```bash
mvn install -DskipTests
```

---

### Out of Memory Error

**Symptoms:**
```
java.lang.OutOfMemoryError: Java heap space
```

**Solutions:**

```bash
# Increase JVM heap size
export JAVA_OPTS="-Xmx2048m -Xms1024m"

# For Maven
export MAVEN_OPTS="-Xmx2048m"

# Permanent (in application.properties)
# Doesn't work in properties - set via startup script
```

---

### 401 Unauthorized on API Endpoints

**Symptoms:**
```
{"status":401,"error":"Unauthorized","message":"Missing token"}
```

**Solutions:**

1. **Check token is sent:**
```javascript
// Frontend - verify token exists
const token = localStorage.getItem('jwt_token');
console.log('Token:', token);

// Include in request
fetch('/api/tickets', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

2. **Verify token format:**
```javascript
// Token should be: eyJhbGci...
// Not: {"token": "eyJhbGci..."}
```

3. **Check token expiration:**
```javascript
// Decode token (don't do in production)
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Expires:', new Date(payload.exp * 1000));
```

---

### Swagger UI Not Loading

**Symptoms:**
```
404 Not Found when accessing /swagger-ui.html
```

**Solutions:**

1. **Verify dependency:**
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.0.0</version>
</dependency>
```

2. **Check configuration:**
```properties
# application.properties
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.enabled=true
```

3. **Access correct URL:**
- Local: http://localhost:8080/swagger-ui.html
- Not: http://localhost:8080/swagger-ui/index.html

---

## Frontend Issues

### npm Install Fails

**Symptoms:**
```
npm ERR! code E404
npm ERR! 404 Not Found
```

**Solutions:**

1. **Clear npm cache:**
```bash
npm cache clean --force
```

2. **Use npm ci instead of npm install:**
```bash
npm ci  # Uses package-lock.json strictly
```

3. **Check npm version:**
```bash
npm --version  # Should be 9+
npm install -g npm@latest
```

4. **Behind corporate proxy:**
```bash
npm config set registry https://registry.npmjs.org/
```

---

### Dependencies Not Installed

**Symptoms:**
```
Module not found: Can't resolve 'axios'
```

**Solutions:**

```bash
# Remove and reinstall
rm -rf node_modules
rm package-lock.json
npm install

# Check if package is listed
npm list axios
```

---

### Port Already in Use

**Symptoms:**
```
EADDRINUSE: address already in use :::5173
```

**Solutions:**

1. **Kill process using port:**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5173
kill -9 <PID>
```

2. **Use different port:**
```bash
npm run dev -- --port 5174
```

---

### Hot Reload Not Working

**Symptoms:**
```
Changes to files don't reflect in browser
```

**Solutions:**

1. **Check vite.config.js:**
```javascript
export default {
  server: {
    hmr: {
      host: 'localhost',
      port: 5173
    }
  }
}
```

2. **Verify file is being saved:**
- Check file modification timestamp
- Try manual refresh (F5)

3. **Check terminal logs:**
```bash
# Should show: "15 modules transformed"
npm run dev
```

---

### Build Fails

**Symptoms:**
```
vite build
error during build: SyntaxError: Unexpected token
```

**Solutions:**

1. **Check syntax errors:**
```bash
npm run lint
```

2. **Clear build cache:**
```bash
rm -rf dist
npm run build
```

3. **Check Node version:**
```bash
node --version  # Should be 18+
```

---

### API Requests Return Empty

**Symptoms:**
```
data: null
No data in response
```

**Solutions:**

1. **Check backend is running:**
```bash
curl http://localhost:8080/api/tickets
```

2. **Check API endpoint in .env:**
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

3. **Check network tab in DevTools:**
- F12 → Network tab
- Look for failed requests
- Check request headers have token

---

### CORS Errors

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:8080/api/tickets' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solutions:**

1. **Backend - Configure CORS:**
```java
// In CorsConfig.java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins("http://localhost:5173")
                    .allowedMethods("GET", "POST", "PATCH", "DELETE")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

2. **Verify CORS header in response:**
```bash
curl -i http://localhost:8080/api/tickets
# Look for: Access-Control-Allow-Origin: http://localhost:5173
```

---

### Images Not Loading

**Symptoms:**
```
Ticket attachment images return 404
```

**Solutions:**

1. **Check upload directory:**
```bash
# Windows
dir uploads\tickets

# Linux
ls -la uploads/tickets/
```

2. **Verify permissions:**
```bash
# Linux - make writable
chmod 755 uploads/
```

3. **Check upload configuration:**
```properties
# application.properties
file.upload.dir=./uploads
```

---

## Database Issues

### Table Structure Mismatch

**Symptoms:**
```
java.sql.SQLException: Unknown column 'col_name' in 'field list'
```

**Solutions:**

1. **Let Hibernate recreate schema:**
```properties
spring.jpa.hibernate.ddl-auto=create-drop  # Dev only
spring.jpa.hibernate.ddl-auto=update       # Prod
```

2. **Manual schema fix:**
```sql
-- Check table structure
DESCRIBE tickets;

-- Verify columns match entity
SELECT * FROM information_schema.COLUMNS
WHERE TABLE_NAME = 'tickets' AND TABLE_SCHEMA = 'smartcampus';
```

---

### Database Connection Pool Issues

**Symptoms:**
```
Unable to obtain JDBC Connection; nested exception is java.sql.SQLException: 
Cannot get a connection, pool error Invalid username or password
```

**Solutions:**

1. **Check connection pool size:**
```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000
```

2. **Verify credentials:**
```bash
mysql -u smartcampus -p password -h localhost
```

---

### Slow Database Queries

**Symptoms:**
```
Query taking > 5 seconds
Tickets list loads very slowly
```

**Solutions:**

1. **Enable query logging:**
```properties
# application.properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
```

2. **Check slow query log:**
```sql
SET GLOBAL slow_query_log = 'ON';
-- Then check
SHOW VARIABLES LIKE 'long_query_time';
SELECT * FROM mysql.slow_log;
```

3. **Add indexes:**
```sql
-- Create indexes for common queries
CREATE INDEX idx_ticket_status ON tickets(status);
CREATE INDEX idx_ticket_priority ON tickets(priority);
CREATE INDEX idx_ticket_user ON tickets(user_id);
```

---

## Authentication Issues

### Google OAuth Not Working

**Symptoms:**
```
Google popup closes without action
Error: "popup_closed_by_user"
```

**Solutions:**

1. **Verify Client ID:**
```javascript
// Check .env
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

// Verify matches Google Cloud Console
```

2. **Check authorized domains:**
- Google Cloud Console → APIs & Services → Credentials
- Add localhost, staging, and production domains
- Wait 5 minutes for changes to propagate

3. **Verify redirect URI:**
```javascript
// In Google Cloud Console:
// Authorized JavaScript origins: http://localhost:5173
// Authorized redirect URIs: http://localhost:5173/auth/callback
```

4. **Check browser console:**
- F12 → Console tab
- Look for Google API errors

---

### Session Expires Unexpectedly

**Symptoms:**
```
{ status: 401, message: "Token expired" }
Redirected to login mid-session
```

**Solutions:**

1. **Check token expiration:**
```javascript
const token = localStorage.getItem('jwt_token');
const payload = JSON.parse(atob(token.split('.')[1]));
const expiresAt = new Date(payload.exp * 1000);
console.log('Token expires at:', expiresAt);
```

2. **Verify JWT secret:**
```properties
# Check backend and frontend use same secret
jwt.secret=your-secret-key-here
```

3. **Check system time:**
```bash
# Server and client clocks must be synchronized
date
ntpupdate -s time.nist.gov  # Sync time
```

---

### Can't Login

**Symptoms:**
```
{ status: 403, message: "Account is disabled" }
or
{ status: 401, message: "Invalid email or password" }
```

**Solutions:**

1. **Verify account exists and is enabled:**
```sql
SELECT * FROM users WHERE email = 'user@example.com';
-- Check 'enabled' column is 1 (true)

-- If disabled, enable:
UPDATE users SET enabled = 1 WHERE email = 'user@example.com';
```

2. **Reset password:**
```bash
# Use admin REST endpoint
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

---

## Deployment Issues

### Application Crashes on Startup

**Symptoms:**
```
Docker container exits immediately
Systemd service fails
```

**Solutions:**

1. **Check logs:**
```bash
# Docker
docker logs smartcampus-backend

# Systemd
journalctl -u smartcampus -n 50 -e
```

2. **Verify environment variables:**
```bash
# Docker
docker run -e SPRING_DATASOURCE_URL=... smartcampus:latest

# Systemd
sudo systemctl show smartcampus -p Environment
```

---

### 502 Bad Gateway

**Symptoms:**
```
502 Bad Gateway (Nginx error)
Backend not responding
```

**Solutions:**

1. **Check backend is running:**
```bash
curl http://localhost:8080
systemctl status smartcampus
```

2. **Check Nginx logs:**
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

3. **Verify Nginx config:**
```bash
nginx -t
```

---

### SSL Certificate Issues

**Symptoms:**
```
ERR_CERT_AUTHORITY_INVALID
NET::ERR_CERT_COMMON_NAME_INVALID
```

**Solutions:**

1. **Check certificate expiry:**
```bash
openssl x509 -in /etc/ssl/certs/smartcampus.crt -noout -dates
```

2. **Renew with Let's Encrypt:**
```bash
sudo certbot renew --force-renewal
```

3. **Verify Nginx SSL config:**
```nginx
# In /etc/nginx/sites-available/smartcampus
ssl_certificate /etc/letsencrypt/live/smartcampus.example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/smartcampus.example.com/privkey.pem;
```

---

## Performance Issues

### High CPU Usage

**Symptoms:**
```
CPU usage > 80%
Application slow to respond
```

**Solutions:**

1. **Check running processes:**
```bash
# Java process
jps -l
jcmd <PID> com.sun.management.DiagnosticCommand perfmap

# System
top
htop
```

2. **Check database queries:**
```properties
# Enable slow query logging
spring.jpa.show-sql=true
logging.level.org.hibernate.SQL=DEBUG
```

3. **Increase JVM heap:**
```bash
export JAVA_OPTS="-Xmx2048m -XX:+UseG1GC"
```

---

### High Memory Usage

**Symptoms:**
```
Heap space error
Memory continues to grow
```

**Solutions:**

1. **Check memory usage:**
```bash
jps -l
jstat -gc <PID> 1000 10
```

2. **Adjust heap size:**
```bash
export JAVA_OPTS="-Xmx2048m -Xms1024m"
```

3. **Find memory leaks:**
```bash
# Generate heap dump
jmap -dump:live,format=b,file=heap.bin <PID>

# Analyze with JProfiler or Eclipse Memory Analyzer
```

---

### Slow Database Queries

**Symptoms:**
```
API endpoints take > 5s
Database transactions timeout
```

**Solutions:**

1. **Query optimization:**
```java
// Use @Query with JOIN FETCH to avoid N+1 queries
@Query("SELECT t FROM Ticket t JOIN FETCH t.comments WHERE t.id = :id")
Ticket findTicketWithComments(@Param("id") Long id);
```

2. **Add pagination:**
```java
// Instead of loading all tickets at once
repository.findAll(PageRequest.of(0, 50));
```

3. **Cache frequently accessed data:**
```java
@Cacheable(value = "tickets")
public List<Ticket> getAllTickets() { ... }
```

---

## Common Error Messages

### Error: "Invalid JWT Token"

**Causes:**
- Token has expired (24 hours)
- Token was modified
- Different secret used for signing/validation

**Fix:**
```bash
# Re-authenticate user
# Clear localStorage and login again
localStorage.clear()
```

---

### Error: "Resource Not Found"

**Causes:**
- Endpoint doesn't exist
- Wrong HTTP method
- Resource ID doesn't exist

**Fix:**
```bash
# Verify endpoint exists
curl http://localhost:8080/api/tickets

# Check resource exists in database
SELECT * FROM tickets WHERE id = 123;
```

---

### Error: "Request Timeout"

**Causes:**
- Database too slow
- Backend unresponsive
- Network issue

**Fix:**
```bash
# Test connectivity
ping backend-server

# Check resources
top
df -h
```

---

## Getting Help

### Before Reporting an Issue

1. **Check logs:**
   - Backend: `journalctl -u smartcampus -n 100`
   - Frontend: F12 → Console tab
   - Database: `/var/log/mysql/error.log`

2. **Verify prerequisites:**
   - Java 17+: `java -version`
   - MySQL 8.0+: `mysql --version`
   - Node 18+: `node --version`

3. **Try basic troubleshooting:**
   - Restart services
   - Clear caches
   - Check configuration

### Reporting Issues

**Include:**
1. Error message (exact text)
2. Steps to reproduce
3. Relevant logs (last 50 lines)
4. Environment:
   - OS (Windows/Linux/Mac)
   - Java version
   - MySQL version
   - Node version
5. What you've already tried

**Submit to:**
- GitHub Issues: https://github.com/yourorg/smart-campus/issues
- Email: support@smartcampus.edu
- Slack: #smart-campus-support

### Resources

- API Documentation: [API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)
- Development Setup: [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)
- Deployment Guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Authentication: [AUTHENTICATION.md](./backend/AUTHENTICATION.md)

---

Document Version: 1.0.0
Last Updated: 2026-03-29
