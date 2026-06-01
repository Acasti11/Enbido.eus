---
name: docker-compose
description: Docker Compose management for Spring Boot + React + MySQL multi-service setup
---

## Docker Compose Rules

### Service Structure
- **3 services minimum**: `backend`, `frontend`, `db`
- **Networks**: `app-network` (internal communication)
- **Volumes**: `mysql-data` (persistent DB storage)
- **Environment**: `.env` file, NEVER commit secrets

### Commands
```bash
# Build and start all
docker-compose up --build

# Stop and remove volumes
docker-compose down -v

# Tail logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Backend Dockerfile
- Multi-stage build: `maven:3.9-eclipse-temurin-21` → `eclipse-temurin:21-jre`
- Copy `pom.xml` first for layer caching
- `mvn clean package -DskipTests` in build stage
- Expose port 8080
- Health check with `curl` or `wget`

### Frontend Dockerfile
- Multi-stage build: `node:20-alpine` → `nginx:alpine`
- `npm ci` for deterministic installs
- `npm run build` for production
- Serve with Nginx, custom `nginx.conf`
- Expose port 80 (or 5173 for dev)

### MySQL Service
- Image: `mysql:8.0`
- Environment: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- Volume: `mysql-data:/var/lib/mysql`
- Port: `3306:3306` (dev only, remove in production)

### Health Checks
- Backend: `curl -f http://localhost:8080/actuator/health`
- Frontend: `curl -f http://localhost:80`
- DB: `mysqladmin ping -h localhost`

### Never
- Commit `.env` files
- Hardcode credentials in docker-compose.yml
- Use `latest` tag for production images
- Run DB as root in production
