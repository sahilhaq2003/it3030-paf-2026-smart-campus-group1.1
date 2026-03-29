# Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Build Preparation](#build-preparation)
4. [Docker Deployment](#docker-deployment)
5. [Traditional Server Deployment](#traditional-server-deployment)
6. [Cloud Deployment (AWS/Azure/GCP)](#cloud-deployment)
7. [Database Migration](#database-migration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Smart Campus Maintenance System can be deployed:
- **Docker Containers** (Recommended for development/staging)
- **Traditional Servers** (Nginx + Java)
- **Cloud Platforms** (AWS, Azure, GCP)
- **Kubernetes** (For large-scale deployments)

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│               Reverse Proxy (Nginx)                      │
│           (SSL/TLS, Load Balancing)                      │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼─────┐ ┌─────▼────┐  ┌─────▼────┐
│   Backend   │ │ Backend  │  │ Backend  │
│   Java #1   │ │ Java #2  │  │ Java #3  │
└───────┬─────┘ └─────┬────┘  └─────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │ JDBC
         ┌─────────────▼──────────────┐
         │   MySQL Database Cluster   │
         │    (Master-Slave Setup)    │
         └─────────────────────────────┘
```

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`mvn test` and `npm test`)
- [ ] Code reviewed and merged to main branch
- [ ] No security vulnerabilities (run `mvn dependency-check:check`)
- [ ] No hardcoded secrets in code
- [ ] Linting passed (`npm run lint`)

### Configuration
- [ ] Environment variables set for target environment
- [ ] Database connection string verified
- [ ] JWT secret is strong (minimum 32 characters)
- [ ] Upload directory is writable
- [ ] CORS configured for production domain

### Database
- [ ] Database backup taken
- [ ] Migration scripts tested on staging
- [ ] Database user and permissions verified
- [ ] Connection pool settings optimized

### Security
- [ ] SSL/TLS certificates generated
- [ ] Firewall rules configured
- [ ] API rate limiting enabled
- [ ] OWASP security headers configured
- [ ] Secrets stored in environment, not files

### Performance
- [ ] Load testing completed
- [ ] Database indexes verified
- [ ] Cache strategy implemented
- [ ] Image compression enabled
- [ ] CDN configured (if needed)

---

## Build Preparation

### Step 1: Update Version Numbers

**Backend - pom.xml:**
```xml
<version>1.0.0</version>  <!-- Change from SNAPSHOT to release -->
```

**Frontend - package.json:**
```json
{
  "version": "1.0.0"
}
```

### Step 2: Create Release Branch

```bash
git checkout main
git pull origin main
git checkout -b release/1.0.0
```

### Step 3: Update Changelog

Create `CHANGELOG.md`:
```markdown
## [1.0.0] - 2026-03-29

### Added
- Initial release
- Google OAuth authentication
- Ticket management system
- Technician dashboard
- Admin panel
- Real-time notifications

### Changed
- Improved performance of ticket listing

### Fixed
- CORS issues on production
```

### Step 4: Build Backend

```bash
cd backend

# Clean previous builds
mvn clean

# Run full test suite
mvn test

# Security check
mvn dependency-check:check

# Build JAR
mvn package -DskipTests -P production

# Verify JAR created
ls -lh target/smart-campus-1.0.0.jar
```

### Step 5: Build Frontend

```bash
cd frontend

# Install dependencies (clean install)
rm -rf node_modules
npm ci

# Run tests
npm test

# Build for production
npm run build

# Verify build
ls -lh dist/
```

### Step 6: Commit and Tag

```bash
git add .
git commit -m "Release v1.0.0"
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin release/1.0.0
git push origin v1.0.0
```

---

## Docker Deployment

### Prerequisites
- Docker installed (https://docs.docker.com/install/)
- Docker Compose installed

### Step 1: Create Dockerfile (Backend)

Create `backend/Dockerfile`:

```dockerfile
# Build stage
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:download-sources
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre
RUN useradd -m appuser
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Step 2: Create Dockerfile (Frontend)

Create `frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Step 3: Create docker-compose.yml

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: smartcampus-db
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: smartcampus
      MYSQL_USER: smartcampus
      MYSQL_PASSWORD: sc_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    container_name: smartcampus-backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/smartcampus
      SPRING_DATASOURCE_USERNAME: smartcampus
      SPRING_DATASOURCE_PASSWORD: sc_password
      JWT_SECRET: your-secret-key-here
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
    ports:
      - "8080:8080"
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./frontend
    container_name: smartcampus-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      VITE_API_BASE_URL: http://localhost:8080/api

volumes:
  mysql_data:
```

### Step 4: Create nginx.conf

Create `frontend/nginx.conf`:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/javascript application/json;

    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|ttf|woff|woff2)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # API reverse proxy
        location /api/ {
            proxy_pass http://backend:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### Step 5: Deploy with Docker Compose

```bash
# Create .env file with secrets
cat > .env << EOF
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
EOF

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Step 6: Verify Deployment

```bash
# Check backend
curl http://localhost:8080/api/auth/me

# Check frontend
curl http://localhost/
```

---

## Traditional Server Deployment

### Prerequisites
- Ubuntu/CentOS server
- Java 17+ installed
- MySQL 8.0+ installed
- Nginx installed
- 2GB+ available disk space

### Step 1: Install Java

```bash
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk

# Verify
java -version
```

### Step 2: Install Nginx

```bash
sudo apt-get install -y nginx

# Start and enable
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 3: Create Application User

```bash
sudo useradd -m -s /bin/bash smartcampus
sudo mkdir -p /opt/smartcampus
sudo chown smartcampus:smartcampus /opt/smartcampus
```

### Step 4: Deploy Backend JAR

```bash
# Copy JAR file
scp backend/target/smart-campus-1.0.0.jar smartcampus@server:/opt/smartcampus/

# Create systemd service
sudo tee /etc/systemd/system/smartcampus.service > /dev/null << EOF
[Unit]
Description=Smart Campus Maintenance System
After=network.target mysql.service

[Service]
Type=simple
User=smartcampus
WorkingDirectory=/opt/smartcampus
Environment="JAVA_OPTS=-Xmx1024m -Xms512m"
ExecStart=/usr/bin/java -jar /opt/smartcampus/smart-campus-1.0.0.jar
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable smartcampus
sudo systemctl start smartcampus

# Check status
sudo systemctl status smartcampus
```

### Step 5: Deploy Frontend

```bash
# Copy built files
scp -r frontend/dist/* smartcampus@server:/var/www/smartcampus/

# Set permissions
sudo chown -R www-data:www-data /var/www/smartcampus
```

### Step 6: Configure Nginx

Create `/etc/nginx/sites-available/smartcampus`:

```nginx
server {
    listen 80;
    server_name smartcampus.example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name smartcampus.example.com;

    # SSL certificates (from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/smartcampus.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smartcampus.example.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        root /var/www/smartcampus;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Swagger UI
    location /swagger-ui.html {
        proxy_pass http://localhost:8080/swagger-ui.html;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/smartcampus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Setup SSL with Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d smartcampus.example.com
```

---

## Cloud Deployment

### AWS Deployment (Elastic Beanstalk)

```bash
# Install AWS CLI
pip install awsebcli

# Initialize Elastic Beanstalk
eb init -p java-17 smartcampus-app

# Create environment
eb create smartcampus-env

# Deploy
eb deploy

# View logs
eb logs

# Monitor
eb open
```

### Azure Deployment (App Service)

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Create resource group
az group create --name smartcampus-rg --location eastus

# Create App Service plan
az appservice plan create \
  --name smartcampus-plan \
  --resource-group smartcampus-rg \
  --sku B2 \
  --is-linux

# Create web app
az webapp create \
  --resource-group smartcampus-rg \
  --plan smartcampus-plan \
  --name smartcampus-app \
  --runtime "JAVA|17"

# Deploy
az webapp deployment source config-zip \
  --resource-group smartcampus-rg \
  --name smartcampus-app \
  --src-path backend/target/smart-campus-1.0.0.jar
```

### GCP Deployment (Cloud Run)

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# Authenticate
gcloud auth login

# Set project
gcloud config set project PROJECT_ID

# Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/smartcampus

# Deploy to Cloud Run
gcloud run deploy smartcampus \
  --image gcr.io/PROJECT_ID/smartcampus \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=cloudsql...
```

---

## Database Migration

### Step 1: Backup Production Database

```bash
# Full backup
mysqldump -u smartcampus -p smartcampus > backup-$(date +%Y%m%d).sql

# Store backup
gsutil cp backup-*.sql gs://your-backup-bucket/
```

### Step 2: Run Migrations

```bash
# Spring Boot auto-migration (Hibernate)
# Set in application.properties:
spring.jpa.hibernate.ddl-auto=update

# Or use Flyway for versioned migrations
# Place SQL files in src/main/resources/db/migration/
# V1__Initial_schema.sql
# V2__Add_new_tables.sql
```

### Step 3: Verify Migration

```bash
# Check tables created
mysql -u smartcampus -p smartcampus -e "SHOW TABLES;"

# Check table structure
mysql -u smartcampus -p smartcampus -e "DESCRIBE tickets;"
```

---

## Monitoring & Logging

### Application Logs

```bash
# Tail logs
tail -f /var/log/smartcampus/app.log

# Search errors
grep ERROR /var/log/smartcampus/app.log | tail -20

# Check via systemd
journalctl -u smartcampus -f
```

### Database Monitoring

```bash
# Monitor connections
SHOW PROCESSLIST;

# Check slow queries
SELECT * FROM mysql.slow_log;

# Monitor table sizes
SELECT table_name, ROUND(data_length+index_length)/1024/1024 AS size_mb
FROM information_schema.TABLES
WHERE table_schema='smartcampus';
```

### Performance Monitoring

```bash
# Monitor CPU/Memory
top

# Monitor disk usage
df -h

# Monitor network
netstat -tulpn | grep 8080
```

### Set Up Log Aggregation

**Using ELK Stack:**
```docker
# In docker-compose.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  
  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
  
  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
```

---

## Backup & Recovery

### Automated Backups

```bash
# Create backup script (backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/smartcampus"
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Application data
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/smartcampus/uploads

# Upload to cloud storage
gsutil cp $BACKUP_DIR/db_$DATE.sql gs://backups/

# Keep only 30 days
find $BACKUP_DIR -mtime +30 -delete

# Schedule with cron
# 0 2 * * * /scripts/backup.sh
```

### Recovery Procedure

```bash
# Stop application
sudo systemctl stop smartcampus

# Restore database
mysql -u smartcampus -p smartcampus < backup-20260329.sql

# Restore files
tar -xzf uploads_20260329.tar.gz -C /opt/smartcampus/

# Restart application
sudo systemctl start smartcampus

# Verify
curl http://localhost:8080/api/auth/me
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
journalctl -u smartcampus -n 50

# Common issues:
# 1. Port already in use
netstat -tulpn | grep 8080

# 2. Database not accessible
mysql -u smartcampus -p -h localhost

# 3. Insufficient permissions
sudo chown smartcampus:smartcampus /opt/smartcampus
```

### High Memory Usage

```bash
# Check heap usage
jps -l

# Adjust JVM memory
export JAVA_OPTS="-Xmx2048m -Xms512m"
java -jar smart-campus-1.0.0.jar
```

### Database Connection Issues

```properties
# In application.properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000
```

### Slow Performance

1. Check database indexes
2. Enable query logging
3. Profile endpoint response times
4. Consider caching

---

## Post-Deployment Verification

```bash
# Health check
curl http://smartcampus.example.com/api/auth/me

# Load test
ab -n 1000 -c 10 http://smartcampus.example.com/

# SSL check
curl -I https://smartcampus.example.com/

# Security scan
curl -I -H "X-Frame-Options" https://smartcampus.example.com/
```

---

Document Version: 1.0.0
Last Updated: 2026-03-29
