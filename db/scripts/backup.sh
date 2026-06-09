#!/bin/bash
# Script de Backup para MySQL (Enbido.eus)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/../../.env"

if [ -f "$ENV_FILE" ]; then
    # Cargar variables de entorno ignorando comentarios y respetando espacios
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ ! "$line" =~ ^# && ! -z "$line" ]]; then
            export "$line"
        fi
    done < "$ENV_FILE"
else
    echo "Error: No se encontró el archivo .env en $ENV_FILE"
    exit 1
fi

# Detectar el comando de contenedores disponible
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
    CONTAINER_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    CONTAINER_CMD="docker-compose"
elif command -v podman &>/dev/null && podman compose version &>/dev/null; then
    CONTAINER_CMD="podman compose"
elif command -v podman-compose &>/dev/null; then
    CONTAINER_CMD="podman-compose"
else
    echo "Error: No se encontró docker, docker-compose, podman o podman-compose en el PATH."
    exit 1
fi

BACKUP_DIR="$SCRIPT_DIR/../backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${MYSQL_DATABASE}_${TIMESTAMP}.sql"

echo "Iniciando copia de seguridad de la base de datos ${MYSQL_DATABASE}..."

# Ejecutar mysqldump a través del contenedor de base de datos primario
# --routines: incluye procedimientos almacenados
# --triggers: incluye triggers
# --single-transaction: consistencia en caliente sin bloquear InnoDB
$CONTAINER_CMD -f "$SCRIPT_DIR/../../docker-compose.yml" exec -T db mysqldump \
  -u root \
  -p"${MYSQL_ROOT_PASSWORD}" \
  --routines \
  --triggers \
  --single-transaction \
  "${MYSQL_DATABASE}" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "¡Copia de seguridad realizada con éxito!"
    echo "Archivo guardado en: $BACKUP_FILE"
    # Mantener solo las últimas 5 copias de seguridad de forma de optimizar espacio
    ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | tail -n +6 | xargs -I {} rm {}
else
    echo "Error: Falló la creación de la copia de seguridad."
    exit 1
fi
