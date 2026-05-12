#!/bin/sh
set -e

echo "Esperando a MySQL en db:3306..."

for i in $(seq 1 30); do
  if wget --no-verbose --tries=1 --spider http://db:3306 2>/dev/null; then
    echo "MySQL listo!"
    break
  fi
  echo "Intento $i/30 - MySQL no disponible, esperando 2s..."
  sleep 2
done

echo "Arrancando Spring Boot..."
exec java -Xms256m -Xmx512m -Dspring.profiles.active=prod -jar app.jar
