-- Crear usuario para la replicacion
CREATE USER IF NOT EXISTS 'repl'@'%' IDENTIFIED BY 'replpass';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';

-- Crear usuario para lectura (usado por la replica en el backend)
CREATE USER IF NOT EXISTS 'muuser_read'@'%' IDENTIFIED BY 'mureadpass';
GRANT SELECT ON mudb.* TO 'muuser_read'@'%';

-- Asegurar que el usuario por defecto (muuser) tenga permisos DML, EXECUTE y de esquema DDL (para DataInitializer)
CREATE USER IF NOT EXISTS 'muuser'@'%' IDENTIFIED BY 'mupass';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, EXECUTE, REFERENCES ON mudb.* TO 'muuser'@'%';

FLUSH PRIVILEGES;
