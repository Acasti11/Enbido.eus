# 🚀 Checklist de Despliegue — Enbido.eus OAuth

## PRE-DESPLIEGUE

### 1. Variables de entorno (`.env`)

Asegúrate de que tu `.env` tiene TODAS estas variables:

```bash
# === Database ===
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=mudb
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_db_password
DB_HOST=db
DB_PORT=3306
DB_PRIMARY_USER=your_db_user
DB_PRIMARY_PASS=your_db_password
DB_REPLICA_USER=your_db_user
DB_REPLICA_PASS=your_db_password

# === JWT ===
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# === Google OAuth ===
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# === SMTP (opcional) ===
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your_email@gmail.com
SPRING_MAIL_PASSWORD=your_app_password
SPRING_MAIL_SMTP_AUTH=true
SPRING_MAIL_SMTP_STARTTLS_ENABLE=true
SPRING_MAIL_FROM=noreply@enbido.eus

# === Spring ===
SPRING_PROFILES_ACTIVE=prod
JAVA_OPTS=-Xms256m -Xmx512m
```

> ⚠️ **NUNCA** subas el archivo `.env` a Git. Está en `.gitignore`.

---

### 2. Google Cloud Console — Configuración de Producción

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Edita tu OAuth 2.0 Client ID:

#### Authorized JavaScript origins (Frontend)
```
http://localhost:5173          # Desarrollo local
https://enbido.eus             # Producción
https://www.enbido.eus         # Producción www
```

#### Authorized redirect URIs (Backend — si usas OAuth flow server-side)
```
https://enbido.eus/api/auth/google/callback
```

4. Verifica que la API "Google+ API" o "People API" esté habilitada
5. Configura la pantalla de consentimiento OAuth:
   - Tipo: External (si es pública) o Internal (si es solo tu org)
   - App name: Enbido
   - User support email: tu email
   - Developer contact: tu email
   - Scopes: `openid`, `email`, `profile`

---

### 3. Backup de Base de Datos (ANTES de DROP TABLE)

```bash
# Backup completo
docker exec -it enbido_db_1 mysqldump -u root -p mudb > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup específico de user_login
docker exec -it enbido_db_1 mysqldump -u root -p mudb user_login > user_login_backup_$(date +%Y%m%d).sql
```

---

## DESPLIEGUE

### Paso 1: Build del backend

```bash
cd backend
./mvnw clean package -DskipTests
```

Verifica que `google-api-client` está en el JAR:
```bash
jar tf target/backend-*.jar | grep google
# Debería mostrar: google/api/client/...
```

### Paso 2: Build del frontend

```bash
cd frontend
npm install
npm run build
```

### Paso 3: Docker Compose

```bash
# Desarrollo
docker-compose up --build

# Producción (detached)
docker-compose -f docker-compose.yml up -d --build
```

### Paso 4: Verificar logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

---

## POST-DESPLIEGUE — Tests de Verificación

### Test 1: Login tradicional (viejo sistema)
```bash
curl -X POST http://localhost:8080/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"username":"usuario_existente","password":"password"}'
```
✅ Debe devolver `200` con `accessToken` o `twoFactorRequired`

### Test 2: Login tradicional (nuevo sistema)
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"email@ejemplo.com","password":"password"}'
```
✅ Debe devolver `200` con `{ token, user }`

### Test 3: Login con Google (simulado)
```bash
# Necesitas un ID token real de Google
curl -X POST http://localhost:8080/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"eyJhbGciOiJSUzI1NiIs..."}'
```
✅ Debe devolver `200` con `{ token, user }` para nuevo usuario
✅ Debe devolver `200` con `{ token, user }` para usuario existente

### Test 4: Vincular Google a cuenta existente
```bash
curl -X POST http://localhost:8080/api/auth/link-google \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_jwt>" \
  -d '{"idToken":"eyJhbGciOiJSUzI1NiIs..."}'
```
✅ Debe devolver `200` con `{ message: "Google account linked successfully" }`

### Test 5: Frontend — Botón Google visible
1. Abre `http://localhost:5173/login`
2. Debe aparecer el botón **"Sign in with Google"**
3. Al hacer clic, debe abrir el popup de Google
4. Al completar, debe redirigir a `/jugar`

### Test 6: Token JWT funciona
```bash
curl -X GET http://localhost:8080/api/usuarios/me \
  -H "Authorization: Bearer <token_de_google_login>"
```
✅ Debe devolver `200` con datos del usuario

### Test 7: Tablas creadas correctamente
```bash
docker exec -it enbido_db_1 mysql -u root -p -e "USE mudb; SHOW TABLES;"
```
✅ Debe mostrar: `users`, `local_auth`, `oauth_auth`

---

## LIMPIEZA FINAL (cuando TODO esté verificado)

### Eliminar tabla antigua user_login

```bash
# Opción A: Ejecutar migración Flyway
# Añade la dependencia flyway-core y flyway-mysql al pom.xml
# El script V999__cleanup_drop_user_login.sql se ejecutará automáticamente

# Opción B: Ejecutar manualmente
docker exec -it enbido_db_1 mysql -u root -p -e "USE mudb; DROP TABLE IF EXISTS user_login;"
```

> ⚠️ **SOLO** ejecutar después de confirmar que:
> - Todos los usuarios están en `users`
> - Login tradicional funciona con `local_auth`
> - Login Google funciona con `oauth_auth`
> - Se hizo backup

---

## ROLLBACK (si algo falla)

```bash
# Restaurar backup
docker exec -i enbido_db_1 mysql -u root -p mudb < backup_YYYYMMDD_HHMMSS.sql

# O restaurar solo user_login
docker exec -i enbido_db_1 mysql -u root -p mudb < user_login_backup_YYYYMMDD.sql
```

---

## MONITORING POST-DESPLIEGUE

Revisa estos logs durante las primeras 24h:

```bash
# Errores de autenticación
docker-compose logs backend | grep -i "auth\|login\|google\|error"

# Errores 401/403
docker-compose logs backend | grep -E "401|403"

# Performance
docker-compose logs backend | grep -i "slow\|timeout"
```

---

## CONTACTO / SOPORTE

Si algo falla:
1. Revisa los logs: `docker-compose logs -f backend`
2. Verifica variables de entorno: `docker-compose exec backend env | grep GOOGLE`
3. Comprueba conectividad: `docker-compose exec backend wget -qO- http://db:3306`
4. Google OAuth issues: Verifica Client ID y origins en Google Cloud Console
