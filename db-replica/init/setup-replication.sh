#!/bin/bash
set -e

echo "============================================="
echo "INICIANDO CONFIGURACIÓN DE LA RÉPLICA"
echo "============================================="

# Esperar a que el nodo primario ('db') esté disponible
until mysql -h db -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1" &>/dev/null; do
  echo "Esperando a que el nodo primario (db) responda..."
  sleep 2
done

echo "Conectado al nodo primario. Configurando replicación..."

# Configurar el canal de replicación mediante GTID (Global Transaction Identifier)
# y arrancar la réplica.
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<SQL_SCRIPT
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST='db',
  SOURCE_USER='repl',
  SOURCE_PASSWORD='replpass',
  SOURCE_AUTO_POSITION=1;
START REPLICA;
SQL_SCRIPT

echo "============================================="
echo "¡REPLICACIÓN INICIADA CON ÉXITO!"
echo "============================================="
