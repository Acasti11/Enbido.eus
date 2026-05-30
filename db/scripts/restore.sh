#!/bin/bash
# Script de Restauración para MySQL (Enbido.eus)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/../../.env"

if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "Error: No se encontró el archivo .env en $ENV_FILE"
    exit 1
fi

BACKUP_DIR="$SCRIPT_DIR/../backups"

# Listar copias de seguridad disponibles
echo "Copias de seguridad disponibles en $BACKUP_DIR:"
echo "------------------------------------------------"
files=($(ls "$BACKUP_DIR"/*.sql 2>/dev/null))
if [ ${#files[@]} -eq 0 ]; then
    echo "No se encontraron copias de seguridad (.sql) en $BACKUP_DIR"
    exit 1
fi

for i in "${!files[@]}"; do
    echo "[$i] $(basename "${files[$i]}")"
done
echo "------------------------------------------------"

read -p "Seleccione el número del archivo que desea restaurar: " index

if [[ -z "$index" || ! "$index" =~ ^[0-9]+$ || "$index" -ge "${#files[@]}" ]]; then
    echo "Selección no válida."
    exit 1
fi

SELECTED_BACKUP="${files[$index]}"
echo "Restaurando $SELECTED_BACKUP en la base de datos ${MYSQL_DATABASE}..."

# Restaurar ejecutando el comando mysql en el contenedor docker 'db'
docker compose -f "$SCRIPT_DIR/../../docker-compose.yml" exec -T db mysql \
  -u root \
  -p"${MYSQL_ROOT_PASSWORD}" \
  "${MYSQL_DATABASE}" < "$SELECTED_BACKUP"

if [ $? -eq 0 ]; then
    echo "¡Restauración completada con éxito!"
else
    echo "Error: Falló la restauración de la base de datos."
    exit 1
fi
