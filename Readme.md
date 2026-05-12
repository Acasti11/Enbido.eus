# 📘 Guía Completa: MUs Full Stack con Docker/Podman

> **Stack:** Spring Boot 3.5.14 + Java 21 | React 18 + TypeScript + Vite | MySQL 8.0 | Nginx
> **Orquestación:** Docker Compose / Podman Compose
> **Sistemas compatibles:** Linux (Docker/podman)"problemas de permisos con SElinux"  y Windows (Docker Desktop)

---

## Tabla de Contenidos

1. [Estructura del Proyecto](#1-estructura-del-proyecto)
2. [Backend - Spring Boot](#2-backend---spring-boot)
3. [Base de Datos - MySQL](#3-base-de-datos---mysql)
4. [Frontend - React + TypeScript + Vite](#4-frontend---react--typescript--vite)
5. [Docker Compose - Orquestación](#5-docker-compose---orquestación)
6. [Comandos de Referencia](#6-comandos-de-referencia)
7. [Solución de Problemas](#7-solución-de-problemas)
8. [Checklist de Despliegue](#8-checklist-de-despliegue)

---

## 1. Estructura del Proyecto

```
----

```
Typescript_prueba/                 ← Raíz del proyecto
├── .git/                          ← Repositorio Git
├── .gitignore                     ← Variables ignoradas en Git
├── docker-compose.yml             ← Orquestación de servicios
├── docker-compose.dev.yml         ← Orquestación para dev container
├── Readme.md                       ← Este archivo
│
├── backend/                        ← SPRING BOOT
│   ├── pom.xml                     ← Dependencias Maven
│   ├── Dockerfile                  ← Build multietapa del backend
│   ├── entrypoint.sh               ← Script de espera a MySQL
│   ├── mvnw                        ← Maven wrapper (Linux/Mac)
│   ├── mvnw.cmd                    ← Maven wrapper (Windows)
│   ├── .gitignore
│   ├── .dockerignore
│   └── src/
│       ├── main/
│       │   ├── java/com/mus/backend/
│       │   │   ├── BackendApplication.java
│       │   │   ├── config/
│       │   │   │   ├── CorsConfig.java
│       │   │   │   └── JpaConfig.java
│       │   │   ├── controller/
│       │   │   │   └── UsuarioController.java
│       │   │   ├── service/
│       │   │   │   └── UsuarioService.java
│       │   │   ├── repository/
│       │   │   │   └── UsuarioRepository.java
│       │   │   ├── model/
│       │   │   │   └── Usuario.java
│       │   │   ├── dto/
│       │   │   │   └── UsuarioDTO.java
│       │   │   └── exception/
│       │   │       └── ResourceNotFoundException.java
│       │   └── resources/
│       │       ├── application.properties
│       │       └── application-prod.properties
│       └── test/
│           └── java/com/mus/backend/
│
├── frontend/                       ← REACT + TYPESCRIPT + VITE
│   ├── package.json                ← Dependencias NPM
│   ├── package-lock.json           ← Lock de dependencias
│   ├── Dockerfile                  ← Build multietapa del frontend
│   ├── nginx.conf                  ← Configuración Nginx
│   ├── .dockerignore               ← Archivos ignorados en Docker
│   ├── .gitignore                  ← Archivos ignorados en Git
│   ├── index.html                  ← Entry point HTML de Vite
│   ├── vite.config.ts              ← Configuración de Vite
│   ├── tsconfig.json               ← Configuración TypeScript
│   ├── tsconfig.node.json          ← Configuración TypeScript (Node)
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── main.tsx                ← Punto de entrada React
│       ├── App.tsx                 ← Componente raíz
│       ├── index.css               ← Estilos globales
│       ├── types/
│       │   └── usuario.ts          ← Tipos TypeScript
│       ├── hooks/
│       │   └── useUsuarios.ts      ← Hook personalizado
│       ├── components/
│       │   └── UsuariosList/
│       │       └── UsuariosList.tsx ← Componente lista
│       ├── services/               ← API calls
│       ├── utils/                  ← Utilidades
│       ├── pages/                  ← Páginas (React Router)
│       └── styles/
│           ├── index.css
│           └── App.css
│
└── db/                             ← BASE DE DATOS
    ├── Dockerfile                  ← Dockerfile MySQL
    ├── .dockerignore
    └── init/
          └── 01-schema.sql           ← Script inicialización DB
```

---

```
## 2. Backend - Spring Boot

### 2.1 Tecnologías

| Componente | Versión |
|------------|---------|
| Spring Boot | 3.5.14 |
| Java | 21 |
| Maven | 3.9 |
| Hibernate | 6.6.49.Final |
| MySQL Connector | 9.7.0 |
| HikariCP | 6.3.3 |

### 2.2 Dockerfile del Backend

**IMPORTANTE:** No usar archivos `.sh` externos (fallan en Windows por CRLF/LF). Todo inline.

```dockerfile
# ─── STAGE 1: BUILD ─────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Cachear dependencias primero
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar código y compilar
COPY src ./src
RUN mvn clean package -DskipTests -B

# ─── STAGE 2: RUNTIME ─────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Crear usuario no-root (seguridad)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar JAR desde builder
COPY --from=builder /app/target/*.jar app.jar
RUN chown appuser:appgroup app.jar

# Instalar wget para healthcheck
RUN apk add --no-cache wget

USER appuser

EXPOSE 8080

# Healthcheck del contenedor
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# ENTRYPOINT inline: espera 15s a MySQL, luego arranca Spring Boot
##LINUX
# Copiar script de entrada
COPY --chown=appuser:appgroup entrypoint.sh /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

##Windows
# NO usar archivos .sh externos (problemas en Windows)
ENTRYPOINT ["sh", "-c", 
  "echo 'Esperando 15 segundos a MySQL...' && sleep 15 && echo 'Arrancando Spring Boot...' && exec java -Xms256m -Xmx512m -Dspring.profiles.active=prod -jar app.jar"
]
```

### 2.3 Configuración por Perfiles

**application-prod.properties** (para contenedor):
```properties
# Datasource (inyectado por variables de entorno)
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:mysql://localhost:3306/mudb}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:muuser}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:mupass}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# Pool de conexiones
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.idle-timeout=300000

# Logging
logging.level.org.springframework=INFO
logging.level.com.mus=DEBUG
```

### 2.4 Endpoints REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/usuarios` | Listar todos |
| GET | `/api/usuarios/{id}` | Obtener por ID |
| POST | `/api/usuarios` | Crear nuevo |
| PUT | `/api/usuarios/{id}` | Actualizar |
| DELETE | `/api/usuarios/{id}` | Eliminar |

---

## 3. Base de Datos - MySQL

### 3.1 Script de Inicialización (db/init/01-schema.sql)

```sql
CREATE DATABASE IF NOT EXISTS mudb 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE mudb;

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    edad INT CHECK (edad >= 0 AND edad <= 150),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_activo (activo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    stock INT DEFAULT 0 CHECK (stock >= 0),
    categoria VARCHAR(50),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria)
) ENGINE=InnoDB;

-- Datos iniciales
INSERT INTO usuarios (nombre, email, edad) VALUES
    ('Administrador', 'admin@mus.com', 30),
    ('Usuario Demo', 'demo@mus.com', 25);

INSERT INTO productos (nombre, descripcion, precio, stock, categoria) VALUES
    ('Laptop Pro', 'Laptop alta gama', 1299.99, 10, 'Tecnología'),
    ('Monitor 4K', 'Monitor 27 pulgadas', 499.50, 15, 'Tecnología');
```

### 3.2 Variables de Entorno

```bash
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=mudb
MYSQL_USER=muuser
MYSQL_PASSWORD=mupass
```

---

## 4. Frontend - React + TypeScript + Vite

### 4.1 Generar Proyecto Vite (sin instalar Node en tu PC)

```bash
# Linux (Podman)
podman run --rm -v "$(pwd)/frontend:/app" -w /app node:20-alpine \
  sh -c "npm install -g create-vite && npm create vite@latest . -- --template react-ts && npm install && npm install react-router-dom"

# Windows (Docker)
docker run --rm -v "${PWD}/frontend:/app" -w /app node:20-alpine \
  sh -c "npm install -g create-vite && npm create vite@latest . -- --template react-ts && npm install && npm install react-router-dom"
```

### 4.2 Estructura de Archivos TypeScript

**src/types/usuario.ts**
```typescript
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
}
```

**src/hooks/useUsuarios.ts**
```typescript
import { useState, useEffect } from 'react';
import type { Usuario } from '../types/usuario';

interface UseUsuariosReturn {
  usuarios: Usuario[];
  loading: boolean;
  error: string | null;
}

export const useUsuarios = (): UseUsuariosReturn => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsuarios = async (): Promise<void> => {
      try {
        const response = await fetch('/api/usuarios');
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const data: Usuario[] = await response.json();
        setUsuarios(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  return { usuarios, loading, error };
};
```

**src/components/UsuariosList/UsuariosList.tsx**
```typescript
import React from 'react';
import { useUsuarios } from '../../hooks/useUsuarios';

export const UsuariosList = (): React.JSX.Element => {
  const { usuarios, loading, error } = useUsuarios();

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h1>Usuarios</h1>
      {usuarios.length === 0 ? (
        <p>No hay usuarios registrados</p>
      ) : (
        <ul>
          {usuarios.map(usuario => (
            <li key={usuario.id}>
              <strong>{usuario.nombre}</strong> — {usuario.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

**src/main.tsx**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 4.3 Dockerfile del Frontend

```dockerfile
# ─── STAGE 1: BUILD ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias primero (cacheo de capas)
COPY package*.json ./
RUN npm ci

# Copiar código fuente y build
COPY . .
RUN npm run build

# ─── STAGE 2: SERVIDOR ─────────────────────────────────────
FROM nginx:alpine

# Vite genera dist/, NO build/ como CRA
COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 4.4 nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;

    # Cache assets estáticos de Vite (tienen hash en nombre)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # React Router: todas las rutas → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy al backend
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.5 .dockerignore

```
node_modules
dist
.git
```

---

## 5. Docker Compose - Orquestación

### 5.1 docker-compose.yml

```yaml
version: '3.8'

services:
  # ─── DATABASE ─────────────────────────────────────────────
  db:
    image: mysql:8.0
    container_name: prueba_mus_db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-mudb}
      MYSQL_USER: ${MYSQL_USER:-muuser}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-mupass}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./db/init:/docker-entrypoint-initdb.d:ro
    ports:
      - "3306:3306"
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # ─── BACKEND ──────────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: prueba_mus_backend
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://db:3306/${MYSQL_DATABASE:-mudb}
      SPRING_DATASOURCE_USERNAME: ${MYSQL_USER:-muuser}
      SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD:-mupass}
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xms256m -Xmx512m"
    ports:
      - "8080:8080"
    networks:
      - app-network

  # ─── FRONTEND ─────────────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: prueba_mus_frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "8081:80"
    networks:
      - app-network

# ─── VOLUMES ────────────────────────────────────────────────
volumes:
  mysql_data:
    driver: local

# ─── NETWORKS ───────────────────────────────────────────────
networks:
  app-network:
    driver: bridge
```

### 5.2 .env

```bash
# MySQL
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=mudb
MYSQL_USER=muuser
MYSQL_PASSWORD=mupass

# Backend
SPRING_PROFILES_ACTIVE=prod
JAVA_OPTS=-Xms256m -Xmx512m
```

---

## 6. Comandos de Referencia

### 6.1 Generar Proyecto Vite desde Cero

```bash
# Linux
rm -rf frontend
mkdir frontend
podman run --rm -v "$(pwd)/frontend:/app" -w /app node:20-alpine \
  sh -c "npm install -g create-vite && npm create vite@latest . -- --template react-ts && npm install && npm install react-router-dom"

# Windows
Remove-Item -Recurse -Force frontend -ErrorAction SilentlyContinue
mkdir frontend
docker run --rm -v "${PWD}/frontend:/app" -w /app node:20-alpine \
  sh -c "npm install -g create-vite && npm create vite@latest . -- --template react-ts && npm install && npm install react-router-dom"
```

### 6.2 Build Local (con Docker/Podman, sin instalar Node)

```bash
# Linux
podman run --rm -v "$(pwd):/app" -w /app node:20-alpine sh -c "npm run build"

# Windows
docker run --rm -v "${PWD}:/app" -w /app node:20-alpine sh -c "npm run build"
```

### 6.3 Construir y Levantar Todo

```bash
# Linux (Podman)
podman-compose down
podman rmi prueba_mus_frontend prueba_mus_backend 2>/dev/null || true
podman-compose up -d --build

# Windows (Docker)
docker-compose down
docker rmi prueba_mus_frontend prueba_mus_backend 2>$null
docker-compose up -d --build
```

### 6.4 Ver Estado y Logs

```bash
# Ver contenedores corriendo
podman ps        # Linux
docker ps        # Windows

# Logs en tiempo real
podman-compose logs -f backend    # Backend
podman-compose logs -f frontend   # Frontend
podman-compose logs -f db         # MySQL

# Entrar a un contenedor
podman exec -it prueba_mus_db sh
docker exec -it prueba_mus_db sh
```

### 6.5 Limpieza de Caché

```bash
# Borrar caché de build
podman builder prune -f
docker builder prune -f

# Limpieza total (⚠️ borra todo)
podman system prune -a -f --volumes
docker system prune -a -f --volumes
```

---

## 7. Solución de Problemas

### 7.1 "Module not found" en build de Vite

**Causa:** Importas un archivo que no existe (ej: `./styles/App.css`)
**Solución:** Verificar rutas relativas correctas desde el archivo que importa.

### 7.2 "Cannot find namespace JSX"

**Causa:** React 18+ no exporta `JSX` globalmente
**Solución:** Usar `React.JSX.Element` en vez de `JSX.Element`:
```typescript
function App(): React.JSX.Element { ... }
```

### 7.3 "is a type and must be imported using type-only import"

**Causa:** TypeScript strict con `verbatimModuleSyntax`
**Solución:** Usar `import type`:
```typescript
import type { Usuario } from '../types/usuario';
```

### 7.4 Backend se cae con "Connection refused" a MySQL

**Causa:** Backend arranca antes de que MySQL acepte conexiones
**Solución:** Añadir espera en ENTRYPOINT del Dockerfile:
```dockerfile
ENTRYPOINT ["sh", "-c", "sleep 15 && java -Xms256m -Xmx512m -Dspring.profiles.active=prod -jar app.jar"]
```

### 7.5 "exec /app/entrypoint.sh: no such file or directory" en Windows

**Causa:** Archivos `.sh` con saltos de línea CRLF (Windows) en vez de LF (Linux)
**Solución:** NO usar archivos `.sh` externos. Poner todo el script en ENTRYPOINT inline.

### 7.6 "host not found in upstream backend" en nginx

**Causa:** El servicio `backend` no está en la misma red Docker o no existe
**Solución:** Verificar que `docker-compose.yml` tenga:
```yaml
services:
  backend:
    networks:
      - app-network
  frontend:
    networks:
      - app-network
networks:
  app-network:
    driver: bridge
```

---

## 8. Checklist de Despliegue

- [ ] `.env` creado con variables correctas
- [ ] `db/init/01-schema.sql` con tablas y datos iniciales
- [ ] Backend: `Dockerfile` con ENTRYPOINT inline (no .sh externos)
- [ ] Backend: `application-prod.properties` configurado
- [ ] Frontend: Proyecto Vite generado con `react-ts` template
- [ ] Frontend: Archivos `.tsx` con tipos correctos (`React.JSX.Element`, `import type`)
- [ ] Frontend: `Dockerfile` copiando desde `/app/dist` (Vite, no `/app/build` de CRA)
- [ ] Frontend: `nginx.conf` con proxy a `backend:8080`
- [ ] Frontend: `.dockerignore` con `node_modules` y `dist`
- [ ] `docker-compose.yml` con `depends_on` y redes configuradas
- [ ] Probar build local antes de Docker: `npm run build` (o con contenedor Node)
- [ ] Probar en navegador: http://localhost:8081 (frontend), http://localhost:8080/api/usuarios (backend)

---

## Notas Importantes

1. **NO usar archivos `.sh` externos** en Dockerfiles (problemas CRLF/LF en Windows)
2. **Vite genera `dist/`**, no `build/` como CRA
3. **Usar `npm ci`** en Docker en vez de `npm install` (más rápido y determinista)
4. **Esperar a MySQL** en el backend con `sleep` o bucle de verificación
5. **Variables de entorno** en `.env`, NO hardcodeadas en código

---

*Documento generado para el proyecto MUs Full Stack*
*Stack: Spring Boot 3.5.14 + React 18 + TypeScript + Vite + MySQL 8.0 + Nginx*
