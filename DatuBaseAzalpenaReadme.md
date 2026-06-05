# Guía Explicativa de la Base de Datos y Arquitectura de Enbido.eus

Este documento contiene la explicación técnica y detallada de cómo el diseño y configuración de la base de datos de Enbido.eus cumple rigurosamente con los criterios de evaluación (rúbrica) del proyecto. Se detallan los motivos teóricos, la justificación de uso y los fragmentos reales de código del proyecto para cada sección.

---

## ÍNDICE DE CONTENIDOS
1. [BLOQUE 1](#bloque-1)
   - [1.1. Copias de Seguridad (Backups) y Gestión de Usuarios](#11-copias-de-seguridad-backups-y-gestión-de-usuarios)
   - [1.2. Comunicación mediante SQL Nativo y JPQL](#12-comunicación-mediante-sql-nativo-y-jpql)
   - [1.3. Adecuación del Modelo Entidad-Relación (E/R)](#13-adecuación-del-modelo-entidad-relación-er)
2. [BLOQUE 2](#bloque-2)
   - [2.1. Proceso de Restauración Automatizado](#21-proceso-de-restauración-automatizado)
   - [2.2. Gestión Eficiente del Acceso (Índices y Conectividad)](#22-gestión-eficiente-del-acceso-índices-y-conectividad)
   - [2.3. Procedimientos Almacenados (PL/SQL)](#23-procedimientos-almacenados-plsql)
   - [2.4. Control de Transacciones y Argumentación ACID](#24-control-de-transacciones-y-argumentación-acid)
3. [BLOQUE 3](#bloque-3)
   - [3.1. Arquitectura de Replicación de Base de Datos](#31-arquitectura-de-replicación-de-base-de-datos)
   - [3.2. Gestión de Acceso Eficiente basada en Replicación (Dynamic Routing)](#32-gestión-de-acceso-eficiente-basada-en-replicación-dynamic-routing)
   - [3.3. Disparadores Automáticos (Triggers)](#33-disparadores-automáticos-triggers)

---

## BLOQUE 1

### 1.1. Copias de Seguridad (Backups) y Gestión de Usuarios

#### A) Copias de Seguridad (Backups)
* **Teoría y Justificación:** La información es el activo más valioso de cualquier aplicación. Un sistema de copias de seguridad (backups) regular garantiza la recuperación ante desastres causados por fallos de hardware, ataques externos (como ransomware) o errores humanos (borrado accidental).
* **Motivo de Uso en Enbido.eus:** Se automatiza el proceso para evitar errores humanos al ejecutar comandos manuales. El script captura de forma atómica tanto la estructura (tablas y restricciones) como los datos, triggers y procedimientos almacenados sin interrumpir la disponibilidad de la aplicación en producción.
* **Detalle del Código:** El script realiza un volcado a través del comando `mysqldump` dentro del contenedor activo `db` de Docker.
  * `--single-transaction`: Asegura que las tablas que utilizan el motor InnoDB se respalden con consistencia transaccional sin necesidad de bloquear lecturas ni escrituras de los usuarios (backup en caliente).
  * `--routines` y `--triggers`: Incluye los procedimientos almacenados y disparadores configurados en el esquema.
  * Limpieza rotativa: Para optimizar el espacio en disco, el comando `ls -t ... | tail -n +6 | xargs rm` lista los archivos ordenados por fecha y elimina todos a partir del sexto más reciente, reteniendo un histórico deslizante de 5 copias.
* **Archivo:** [`db/scripts/backup.sh`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/db/scripts/backup.sh)
```bash
#!/bin/bash
# Script de Backup para MySQL (Enbido.eus)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/../../.env"

if [ -f "$ENV_FILE" ]; then
    # Cargar variables de entorno ignorando comentarios
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "Error: No se encontró el archivo .env en $ENV_FILE"
    exit 1
fi

BACKUP_DIR="$SCRIPT_DIR/../backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${MYSQL_DATABASE}_${TIMESTAMP}.sql"

echo "Iniciando copia de seguridad de la base de datos ${MYSQL_DATABASE}..."

# Ejecutar mysqldump a través del contenedor docker primario 'db'
docker compose -f "$SCRIPT_DIR/../../docker-compose.yml" exec -T db mysqldump \
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
```

#### B) Gestión y Creación de Usuarios
* **Teoría y Justificación:** Siguiendo el principio de menor privilegio (Principle of Least Privilege), cada servicio o canal debe tener únicamente los permisos necesarios para realizar sus operaciones definidas. Esto acota la superficie de ataque si las credenciales de un usuario son filtradas o vulneradas.
* **Motivo de Uso en Enbido.eus:** Se definen tres perfiles de usuarios de base de datos diferenciados para separar la replicación, la lectura web y la escritura del backend principal.
* **Detalle del Código:**
  * `repl`: Usuario con el privilegio mínimo `REPLICATION SLAVE`. Exclusivo para que la réplica lea el log binario del nodo primario.
  * `muuser_read`: Usuario de lectura. Exclusivo para consultas SQL ejecutadas por el backend web destinadas al servidor réplica. Solo cuenta con privilegios `SELECT`.
  * `muuser`: Usuario principal de escritura. Cuenta con privilegios DML (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) y privilegios controlados DDL (`CREATE`, `ALTER`, `EXECUTE`, `REFERENCES`) para ejecutar procedimientos y permitir la auto-configuración de Hibernate.
* **Archivo:** [`db/init/00-users.sql`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/db/init/00-users.sql)
```sql
-- Crear usuario para la replicacion
CREATE USER IF NOT EXISTS 'repl'@'%' IDENTIFIED BY 'replpass';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';

-- Crear usuario para lectura (usado por la replica en el backend)
CREATE USER IF NOT EXISTS 'muuser_read'@'%' IDENTIFIED BY 'mureadpass';
GRANT SELECT ON mudb.* TO 'muuser_read'@';

-- Asegurar que el usuario por defecto (muuser) tenga permisos DML, EXECUTE y de esquema DDL (para DataInitializer)
CREATE USER IF NOT EXISTS 'muuser'@'%' IDENTIFIED BY 'mupass';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, EXECUTE, REFERENCES ON mudb.* TO 'muuser'@'%';

FLUSH PRIVILEGES;
```

---

### 1.2. Comunicación mediante SQL Nativo y JPQL

* **Teoría y Justificación:** Aunque el uso de ORMs (como JPA/Hibernate) agiliza el desarrollo de CRUDs simples, las consultas complejas y la ejecución de lógica transaccional de alto rendimiento requieren el uso de SQL estructurado o JPQL parametrizado.
* **Motivo de Uso en Enbido.eus:** Permite controlar con precisión las consultas complejas, optimizando el uso de índices creados en la base de datos y previniendo los ataques de Inyección SQL mediante el uso obligatorio de parámetros nombrados (`@Param`).
* **Detalle del Código:**
  * **JPQL en Repositorio de Quedadas:** Se define una consulta para obtener únicamente las quedadas que siguen activas y cuya fecha programada no ha expirado aún con respecto a la hora del servidor (`:now`):
    * **Archivo:** [`LocalMeetupAdRepository.java`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/backend/src/main/java/com/mus/backend/repository/LocalMeetupAdRepository.java)
    ```java
    package com.mus.backend.repository;

    import com.mus.backend.model.LocalMeetupAd;
    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.data.jpa.repository.Query;
    import org.springframework.data.repository.query.Param;
    import org.springframework.stereotype.Repository;

    import java.time.LocalDateTime;
    import java.util.List;

    @Repository
    public interface LocalMeetupAdRepository extends JpaRepository<LocalMeetupAd, Long> {
        List<LocalMeetupAd> findByIsActiveTrue();

        @Query("SELECT m FROM LocalMeetupAd m WHERE m.isActive = true AND (m.scheduledAt IS NULL OR m.scheduledAt >= :now)")
        List<LocalMeetupAd> findActiveAndNotExpired(@Param("now") LocalDateTime now);
    }
    ```
  * **JPQL en Repositorio de Amistades:** Resuelve la relación de amistad bidireccional entre dos usuarios de manera eficiente sin tener que recurrir a múltiples selectores condicionales en el código Java:
    * **Archivo:** [`FriendshipRepository.java`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/backend/src/main/java/com/mus/backend/repository/FriendshipRepository.java)
    ```java
    package com.mus.backend.repository;

    import com.mus.backend.model.Friendship;
    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.data.jpa.repository.Query;
    import org.springframework.data.repository.query.Param;
    import org.springframework.stereotype.Repository;
    import java.util.Optional;

    @Repository
    public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
        // ... otros métodos autogenerados ...

        @Query("SELECT f FROM Friendship f WHERE (f.userId1 = :u1 AND f.userId2 = :u2) OR (f.userId1 = :u2 AND f.userId2 = :u1)")
        Optional<Friendship> findRelation(@Param("u1") Long u1, @Param("u2") Long u2);
    }
    ```
  * **Llamada a PL/SQL desde Servicios:** Spring invoca al procedimiento de compra mediante el gestor de entidades nativo, declarando parámetros de entrada y salida:
    * **Archivo:** [`ShopService.java`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/backend/src/main/java/com/mus/backend/service/ShopService.java#L67-L91)
    ```java
    StoredProcedureQuery query = entityManager.createStoredProcedureQuery("sp_buy_item");
    query.registerStoredProcedureParameter("p_user_id", Long.class, ParameterMode.IN);
    query.registerStoredProcedureParameter("p_item_id", Long.class, ParameterMode.IN);
    query.registerStoredProcedureParameter("p_status", String.class, ParameterMode.OUT);
    query.registerStoredProcedureParameter("p_new_coins", Integer.class, ParameterMode.OUT);

    query.setParameter("p_user_id", userId);
    query.setParameter("p_item_id", itemId);

    query.execute();
    ```

---

### 1.3. Adecuación del Modelo Entidad-Relación (E/R)

* **Teoría y Justificación:** Un modelo entidad-relación robusto debe normalizar los datos para evitar la redundancia, asegurar la integridad referencial de las llaves foráneas y estructurar índices para el rendimiento de la aplicación.
* **Motivo de Uso en Enbido.eus:** Se normaliza el esquema relacional en tercera forma normal (3FN) para modelar todos los requisitos de negocio de Enbido, como el sistema de autenticación dual, emparejamientos en torneos de Mus y geolocalización de tabernas para partidas físicas.
* **Esquema de Tablas Clave y Restricciones (Fragmento):**
  * **Autenticación Dividida:** La información de usuario en `users` se separa de las credenciales de inicio tradicionales (`local_auth`) y del registro a través de Google (`oauth_auth`). Esto permite desacoplar los flujos de seguridad del perfil general.
  * **Integridad en Torneos:** Relación muchos a muchos entre usuarios y torneos resuelta mediante la tabla de ruptura `tournament_participant` con claves primarias compuestas y llaves foráneas con políticas de cascada (`ON DELETE CASCADE`).
  * **Restricción de Negocio en Parejas:** La tabla `physical_tournament_team` asegura que una pareja no pueda estar compuesta por el mismo jugador mediante una restricción `CHECK`:
    ```sql
    CHECK (player_1_id <> player_2_id)
    ```
  * **Quedadas Físicas (Tabernas):** La tabla `local_meetup_ad` almacena la latitud y longitud geográfica de las tabernas junto a un contador de jugadores restantes necesarios para abrir la partida de Mus.
* **Archivo:** [`db/init/01-schema.sql`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/db/init/01-schema.sql)
```sql
-- Tabla central de usuarios
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    postal_code VARCHAR(20),
    username VARCHAR(50) UNIQUE,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_banned BOOLEAN DEFAULT FALSE,
    birth_date DATE,
    profile_picture VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de credenciales locales (email/password)
CREATE TABLE IF NOT EXISTS local_auth (
    auth_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    password VARCHAR(255) NOT NULL,
    two_factor_enabled TINYINT(1) DEFAULT 0,
    two_factor_code VARCHAR(6),
    two_factor_code_expires_at DATETIME,
    reset_password_token VARCHAR(255),
    reset_password_token_expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_local_auth_user (user_id)
);

-- Tabla de credenciales Google OAuth
CREATE TABLE IF NOT EXISTS oauth_auth (
    auth_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(100) NOT NULL,
    provider_email VARCHAR(150) NOT NULL,
    access_token VARCHAR(500),
    refresh_token VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_provider_user (provider, provider_user_id)
);
```

---

## BLOQUE 2

### 2.1. Proceso de Restauración Automatizado

* **Teoría y Justificación:** Disponer de copias de seguridad no aporta valor si no se valida y automatiza el proceso inverso: la restauración. Un script de restauración automatizado minimiza la probabilidad de error humano durante el despliegue crítico de rescate de datos.
* **Motivo de Uso en Enbido.eus:** El script lee interactivamente el contenido de la carpeta de respaldos, muestra los archivos en orden y permite realizar la restauración en caliente en el contenedor primario con confirmación y manejo de salida de errores.
* **Detalle del Código:**
  * Carga dinámicamente los archivos `.sql` de la carpeta `db/backups`.
  * Valida que la selección del operador sea un número dentro del rango válido de backups.
  * Inyecta el volcado SQL mediante redirección de entrada `<` sobre el cliente `mysql` de Docker.
* **Archivo:** [`db/scripts/restore.sh`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/db/scripts/restore.sh)
```bash
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
```

---

### 2.2. Gestión Eficiente del Acceso (Índices y Conectividad)

* **Teoría y Justificación:** Para garantizar la escalabilidad y un bajo tiempo de respuesta del servidor (latencia), es imperativo optimizar el acceso físico de lectura mediante índices estructurados que eviten lecturas completas de tablas (Full Table Scan) en memoria. Además, se debe optimizar el uso de conexiones mediante pools persistentes.
* **Motivo de Uso en Enbido.eus:** Se optimizan las consultas más recurrentes de la aplicación, como la carga de quedadas activas en el mapa y la clasificación de ranking global de jugadores.
* **Detalle del Código:**
  1. **Índices de Alto Rendimiento:**
     * `idx_user_game_profile_elo`: Índice de árbol B (B-Tree) ordenado de forma descendente en el atributo `elo`. Agiliza instantáneamente las consultas de emparejamiento (matchmaking) por nivel y la carga de clasificaciones mundiales.
     * `idx_local_meetup_ad_active`: Índice sobre la columna `is_active` en la tabla de anuncios de quedadas para filtrar en milisegundos las quedadas visibles a los usuarios.
     * **Archivo:** [`db/init/01-schema.sql`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/db/init/01-schema.sql#L466-L467)
     ```sql
     CREATE INDEX idx_user_game_profile_elo ON user_game_profile(elo DESC);
     CREATE INDEX idx_local_meetup_ad_active ON local_meetup_ad(is_active);
     ```
  2. **LazyConnectionDataSourceProxy (Conexiones Perezosas):**
     * Spring Boot por defecto captura una conexión física de la base de datos nada más iniciar una transacción (anotación `@Transactional`). 
     * Con `LazyConnectionDataSourceProxy`, la transacción se inicia en el backend pero no se extrae ninguna conexión física del pool de Hikari hasta que realmente se ejecuta el primer statement SQL (`SELECT`, `INSERT`, etc.). Esto minimiza el tiempo de retención de las conexiones del pool.
     * **Archivo:** [`DataSourceConfig.java`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/backend/src/main/java/com/mus/backend/config/DataSourceConfig.java#L57)
     ```java
     return new LazyConnectionDataSourceProxy(routingDataSource);
     ```

---

### 2.3. Procedimientos Almacenados (PL/SQL)

* **Teoría y Justificación:** Los procedimientos almacenados encapsulan lógica procedimental compleja y se compilan directamente en el servidor de base de datos. Esto reduce drásticamente el tráfico en la red al evitar enviar sentencias intermedias de comprobación.
* **Motivo de Uso en Enbido.eus:** La compra de un objeto en la tienda requiere múltiples verificaciones de seguridad (existencia del ítem, validación de monedas del usuario, inserción en inventario sin duplicados y registro histórico). Ejecutar esto de forma distribuida en el código Java expondría el sistema a fallos parciales o inconsistencias si la conexión se interrumpe a mitad de proceso.
* **Detalle del Código (`sp_buy_item`):**
  * `DECLARE EXIT HANDLER FOR SQLEXCEPTION`: Capturador de excepciones que intercepta cualquier error de SQL y realiza un `ROLLBACK` seguro devolviendo un código de error.
  * `START TRANSACTION` y `COMMIT`: Definen el límite transaccional atómico.
  * Valida la existencia del artículo y si el saldo del usuario es suficiente (`v_coins < v_price`), devolviendo salidas lógicas controladas.
* **Archivo:** [`db/init/01-schema.sql`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/db/init/01-schema.sql#L476-L532)
```sql
DROP PROCEDURE IF EXISTS sp_buy_item;
    
DELIMITER //

CREATE PROCEDURE sp_buy_item(
    IN p_user_id BIGINT,
    IN p_item_id BIGINT,
    OUT p_status VARCHAR(50),
    OUT p_new_coins INT
)
BEGIN
    DECLARE v_price INT;
    DECLARE v_coins INT;
    
    -- Manejador de errores para hacer ROLLBACK ante cualquier excepción SQL
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'ERROR';
        SET p_new_coins = NULL;
    END;
    
    START TRANSACTION;
    
    -- Consultar precio del item
    SELECT price INTO v_price FROM items WHERE item_id = p_item_id;
    
    IF v_price IS NULL THEN
        SET p_status = 'ITEM_NOT_FOUND';
        SET p_new_coins = NULL;
        ROLLBACK;
    ELSE
        -- Consultar monedas actuales del usuario
        SELECT coins INTO v_coins FROM user_game_profile WHERE user_id = p_user_id;
        
        IF v_coins IS NULL THEN
            SET p_status = 'USER_NOT_FOUND';
            SET p_new_coins = NULL;
            ROLLBACK;
        ELSEIF v_coins < v_price THEN
            SET p_status = 'INSUFFICIENT_FUNDS';
            SET p_new_coins = v_coins;
            ROLLBACK;
        ELSE
            -- Descontar monedas
            UPDATE user_game_profile SET coins = coins - v_price WHERE user_id = p_user_id;
            
            -- Añadir al inventario (evitando duplicados mediante IGNORE)
            INSERT IGNORE INTO user_inventory (user_id, item_id) VALUES (p_user_id, p_item_id);
            
            -- Añadir al historial de compras
            INSERT INTO purchase_history (user_id, item_id, coins_spent) VALUES (p_user_id, p_item_id, v_price);
            
            -- Retornar estado de éxito y nuevas monedas
            SET p_status = 'SUCCESS';
            SET p_new_coins = v_coins - v_price;
            
            COMMIT;
        END IF;
    END IF;
END //

DELIMITER ;
```

---

### 2.4. Control de Transacciones y Argumentación ACID

* **Teoría y Justificación:** Las transacciones aseguran las propiedades ACID de la base de datos:
  * **Atomicidad:** O se ejecutan todos los pasos o ninguno.
  * **Consistencia:** La base de datos pasa de un estado válido a otro igualmente válido.
  * **Aislamiento:** Las transacciones concurrentes no interfieren entre sí.
  * **Durabilidad:** Una vez completada (committed), los datos persisten incluso tras un fallo.
* **Motivo de Uso en Enbido.eus:** Se aplican transacciones explícitas tanto en el motor relacional como en las capas de servicios web para evitar estados corruptos (como usuarios que pierdan sus monedas pero no reciban el avatar comprado).
* **Detalle del Código:*  * En consultas exclusivas de búsqueda (como recuperar inventario o mostrar ítems), se utiliza `@Transactional(readOnly = true)`. Esto le indica a Hibernate que desactive la comprobación de cambios (dirty checking), reduciendo el consumo de memoria y permitiendo que la conexión se derive dinámicamente al servidor de base de datos réplica.
* **Archivo:** [`ShopService.java`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/backend/src/main/java/com/mus/backend/service/ShopService.java)
```java
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getShopItems() {
        List<Item> items = itemRepository.findAll();
        // ... mapeo de resultados ...
    }

    @Transactional
    public Map<String, Object> buyItem(Long userId, Long itemId) {
        // ... validación e invocación segura del procedimiento sp_buy_item ...
    }
```

---

## BLOQUE 3

### 3.1. Arquitectura de Replicación de Base de Datos

* **Teoría y Justificación:** En entornos de producción, disponer de un único servidor de base de datos (Single Point of Failure) expone a la aplicación a pérdidas totales de servicio si este falla. La replicación maestro-esclavo (Primary-Replica) duplica asíncronamente las mutaciones del nodo de escritura sobre uno o varios nodos de lectura en tiempo real.
* **Motivo de Uso en Enbido.eus:** Asegura alta disponibilidad. La réplica mantiene una copia idéntica del esquema y datos en el puerto 3307, aislando al nodo maestro de la carga pesada de búsquedas concurrentes y permitiendo realizar copias de seguridad directamente desde la réplica sin mermar el rendimiento del juego principal.
* **Detalles del Flujo y Configuración:**
  * **Nodo Primario (`db`):** 
    * `server-id=1`: Identifica de manera única al servidor dentro del clúster de replicación.
    * `log-bin=mysql-bin`: Activa el registro binario en disco (binlog) que captura todos los comandos DDL y DML de escritura.
    * `binlog_format=ROW`: Registra las mutaciones a nivel de fila individual para evitar inconsistencias en la réplica al usar funciones indeterministas.
    * `gtid_mode=ON` y `enforce_gtid_consistency=ON`: Habilita identificadores de transacción globales (GTID) para mapear el estado de sincronización exacto sin depender de nombres y posiciones físicas del archivo del binlog.
    * **Archivo:** [`db/conf.d/primary.cnf`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/db/conf.d/primary.cnf)
    ```ini
    [mysqld]
    server-id=1
    log-bin=mysql-bin
    binlog_format=ROW
    gtid_mode=ON
    enforce_gtid_consistency=ON
    binlog_do_db=mudb
    default-authentication-plugin=mysql_native_password
    ```
  * **Nodo Réplica (`db-replica`):**
    * `server-id=2`: Identificador del nodo secundario.
    * `relay-log=mysql-relay-bin`:H abilita la cola interna de lectura donde se reciben las transacciones binarias del primario para su posterior procesamiento estructurado en hilos de trabajo independientes.
    * **Archivo:** [`db-replica/conf.d/replica.cnf`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/db-replica/conf.d/replica.cnf)
    ```ini
    [mysqld]
    server-id=2
    gtid_mode=ON
    enforce_gtid_consistency=ON
    default-authentication-plugin=mysql_native_password
    relay-log=mysql-relay-bin
    relay-log-index=mysql-relay-bin.index
    log_replica_updates=ON
    ```
  * **Script de Sincronización Automática:** Se ejecuta en la réplica al iniciar. Detecta mediante un bucle de espera la salud del primario, configura el origen de los logs de transacciones mediante la instrucción `CHANGE REPLICATION SOURCE` y fuerza a la réplica a operar exclusivamente en modo lectura de seguridad (`read_only` y `super_read_only`).
    * **Archivo:** [`db-replica/init/setup-replication.sh`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/db-replica/init/setup-replication.sh)
    ```bash
    #!/bin/bash
    set -e

    # Esperar a que el nodo primario ('db') esté disponible
    until mysql -h db -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1" &>/dev/null; do
      echo "Esperando a que el nodo primario (db) responda..."
      sleep 2
    done

    # Configurar el canal de replicación mediante GTID (Global Transaction Identifier)
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<SQL_SCRIPT
    CHANGE REPLICATION SOURCE TO
      SOURCE_HOST='db',
      SOURCE_USER='repl',
      SOURCE_PASSWORD='replpass',
      SOURCE_AUTO_POSITION=1;
    START REPLICA;
    SET PERSIST read_only = ON;
    SET PERSIST super_read_only = ON;
    SQL_SCRIPT
    ```
  * **Integración en Docker Compose:** El servicio `db-replica` depende de que `db` esté completamente saludable (`condition: service_healthy`), asegurando un orden correcto de arranque y aprovisionamiento.
    * **Archivo:** [`docker-compose.yml`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/docker-compose.yml#L22-L43)
    ```yaml
      db-replica:
        build: ./db-replica
        environment:
          MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
          MYSQL_DATABASE: ${MYSQL_DATABASE}
          MYSQL_USER: ${MYSQL_USER}
          MYSQL_PASSWORD: ${MYSQL_PASSWORD}
        ports:
          - "3307:3306"
        volumes:
          - mysql_replica_data:/var/lib/mysql
          - ./db-replica/init:/docker-entrypoint-initdb.d
        depends_on:
          db:
            condition: service_healthy
    ```

#### Ejemplo práctico del flujo de replicación (Registro de un usuario):
1. **Petición del Cliente**: Un usuario se registra en la web introduciendo sus datos.
2. **Escritura en el Primario (`db`)**: El backend de Spring Boot ejecuta una instrucción `INSERT INTO users (name, email, username) VALUES ('Mikel', 'mikel@email.com', 'mikel')` en la base de datos primaria (`db` en el puerto 3306).
3. **Registro en el Log Binario**: El servidor MySQL maestro escribe físicamente la fila en disco y la registra en el `Binary Log` con un identificador de transacciones global (GTID), p.ej., `3E11FA2D-4B82-11E1-82C0-123456789012:1`.
4. **Mensajería de Replicación (IO Thread)**: El proceso de replicación en segundo plano de `db-replica` (`IO Thread`) solicita las nuevas transacciones al maestro mediante el canal autenticado con el usuario `repl`. Se descarga la transacción `GTID:1` y la escribe en el archivo local de relevo (`Relay Log`).
5. **Aplicación del cambio (SQL Thread)**: El hilo de base de datos de la réplica (`SQL Thread`) lee secuencialmente el `Relay Log` y ejecuta localmente la inserción del usuario Mikel.
6. **Resultado**: El usuario Mikel se encuentra disponible instantáneamente en ambos nodos de base de datos de manera consistente.

---

### 3.2. Gestión de Acceso Eficiente basada en Replicación (Dynamic Routing)

* **Teoría y Justificación:** Configurar una base de datos réplica física no mejora el rendimiento por sí sola si la aplicación web sigue enviando todas sus consultas SQL al nodo maestro. Es necesario programar un middleware lógico de reparto dinámico de consultas en función de la naturaleza de la transacción.
* **Motivo de Uso en Enbido.eus:** Se automatiza el reparto de carga. Cuando un controlador web lee rankings, perfiles o torneos, el tráfico se enruta automáticamente a la base de datos réplica (reduciendo drásticamente la carga de CPU y memoria de la base de datos de escritura). Cuando se detecta una operación de escritura (compra de ítems, registro de puntuaciones), el tráfico ya viaja inmediatamente al maestro.
* **Detalle del Código:**
  * Se sobrescribe la clase `AbstractRoutingDataSource` de Spring JDBC para crear `TransactionRoutingDataSource`.
  * `TransactionSynchronizationManager.isCurrentTransactionReadOnly()` detecta si el contexto de la transacción actual en Spring es de solo lectura.
  * Devuelve una constante (PRIMARY o REPLICA) que actúa como clave de lookup en el mapa de conexiones de base de datos activas.
* **Archivo:** [`DataSourceConfig.java`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/backend/src/main/java/com/mus/backend/config/DataSourceConfig.java)
```java
package com.mus.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.LazyConnectionDataSourceProxy;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;


@Configuration
public class DataSourceConfig {

    public enum DataSourceType {
        PRIMARY, REPLICA
    }

    public static class TransactionRoutingDataSource extends AbstractRoutingDataSource {
        @Override
        protected Object determineCurrentLookupKey() {
            // Evalúa si la transacción actual de Spring es Read-Only
            boolean isReadOnly = TransactionSynchronizationManager.isCurrentTransactionReadOnly();
            // Retorna la clave del DataSource correspondiente
            return isReadOnly ? DataSourceType.REPLICA : DataSourceType.PRIMARY;
        }
    }

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.primary")
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.replica")
    public DataSource replicaDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @Primary
    public DataSource dataSource() {
        TransactionRoutingDataSource routingDataSource = new TransactionRoutingDataSource();
        
        Map<Object, Object> dataSourceMap = new HashMap<>();
        dataSourceMap.put(DataSourceType.PRIMARY, primaryDataSource());
        dataSourceMap.put(DataSourceType.REPLICA, replicaDataSource());
        
        routingDataSource.setTargetDataSources(dataSourceMap);
        routingDataSource.setDefaultTargetDataSource(primaryDataSource());
        routingDataSource.afterPropertiesSet();
        
        // LazyConnectionDataSourceProxy garantiza que la obtención de conexión del pool se aplace
        // hasta que el enrutador haya evaluado correctamente la naturaleza de la transacción
        return new LazyConnectionDataSourceProxy(routingDataSource);
    }
}
```

#### Ejemplos de flujo real paso a paso:

##### Caso A: Cargar la clasificación mundial (Operación de Lectura)
1. El usuario navega a la pestaña de clasificación. El frontend llama al endpoint `GET /api/usuarios/ranking`.
2. En el backend, el servicio correspondiente está anotado con `@Transactional(readOnly = true)`.
3. Spring Boot abre la transacción de solo lectura.
4. El enrutador `TransactionRoutingDataSource` ejecuta `determineCurrentLookupKey()`.
5. Evalúa si la transacción es read-only: `isReadOnly` es `true`. Retorna `DataSourceType.REPLICA`.
6. El gestor de conexiones `LazyConnectionDataSourceProxy` pide una conexión física al pool del servidor réplica (`jdbc:mysql://db-replica:3306/mudb`).
7. Se ejecuta la consulta pesada `SELECT username, elo FROM user_game_profile ORDER BY elo DESC LIMIT 10` contra el nodo réplica.
8. El nodo primario `db` permanece totalmente ocioso y libre de carga de disco/CPU durante todo este flujo.

##### Caso B: Comprar un artículo de la tienda (Operación de Escritura)
1. El usuario hace clic en "Comprar artículo". El frontend llama a `POST /api/shop/buy/3`.
2. En el backend, el método `buyItem` de `ShopService` está anotado con `@Transactional` estándar (de escritura).
3. Spring Boot abre una transacción de lectura/escritura (por defecto).
4. El enrutador `TransactionRoutingDataSource` ejecuta `determineCurrentLookupKey()`.
5. Evalúa si la transacción es read-only: `isReadOnly` es `false`. Retorna `DataSourceType.PRIMARY`.
6. Se pide una conexión física al pool del servidor maestro (`jdbc:mysql://db:3306/mudb`).
7. Se ejecuta el procedimiento almacenado de compra `sp_buy_item`. La base de datos realiza la comprobación, resta el saldo de txanpons al perfil del usuario e inserta el ítem de la baraja en su inventario.
8. Se ejecuta un `COMMIT` en el maestro. Los cambios se escriben en el `binlog` del maestro y se replican asíncronamente a la réplica para su actualización en milisegundos.

---

### 3.3. Disparadores Automáticos (Triggers)

* **Teoría y Justificación:** Los triggers (disparadores) son procedimientos almacenados automáticos que se ejecutan directamente en el motor relacional en respuesta a eventos DML específicos (`INSERT`, `UPDATE`, `DELETE`). Aseguran que se mantengan de manera forzosa las invariants de negocio a nivel de persistencia de datos con total independencia de qué cliente o servicio inserte la información.
* **Motivo de Uso en Enbido.eus:** Cuando un usuario se registra (sea por el flujo normal de registro de email o bien a través del token de inicio rápido OAuth de Google), el sistema debe asegurar que se inicialice su perfil de juego `user_game_profile` con saldo inicial de 100 monedas y 200 puntos de ELO. Si esta lógica de inicialización residiera únicamente en el backend de Spring Boot, un despiste del programador en alguno de los múltiples controladores de autenticación podría dejar a un usuario sin perfil, provocando excepciones críticas de tipo null pointer al intentar cargar su inventario o iniciar una partida.
* **Detalle del Código:** El trigger `after_users_insert` intercepta de manera asíncrona cada nueva fila inyectada en `users` e inicializa de manera automática su correspondiente perfil del juego referenciando el `user_id` recién creado.
* **Archivo:** [`db/init/01-schema.sql`](file:///home/xaldasoro/Documents/pbl4/enbido.eus/db/init/01-schema.sql#L539-L552)
```sql
DROP TRIGGER IF EXISTS after_users_insert;

DELIMITER //

CREATE TRIGGER after_users_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    -- Inicializar perfil de juego de forma automática para el nuevo usuario
    INSERT IGNORE INTO user_game_profile (user_id, elo, coins, total_games_played, total_games_won) 
    VALUES (NEW.user_id, 200, 100, 0, 0);
END //

DELIMITER ;
```
