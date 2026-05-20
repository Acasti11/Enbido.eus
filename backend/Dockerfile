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
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/usuarios || exit 1

# ENTRYPOINT inline: espera 15s a MySQL, luego arranca Spring Boot
##Windows
# NO usar archivos .sh externos (problemas en Windows)
ENTRYPOINT ["sh", "-c", "echo 'Esperando 15 segundos a MySQL...' && sleep 15 && echo 'Arrancando Spring Boot...' && exec java -Xms256m -Xmx512m -Dspring.profiles.active=prod -jar app.jar"]