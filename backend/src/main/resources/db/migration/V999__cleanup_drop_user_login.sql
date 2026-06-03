-- ============================================================
-- SCRIPT DE LIMPIEZA: Eliminar tabla antigua user_login
-- ============================================================
-- ⚠️  WARNING: EJECUTAR SOLO DESPUÉS DE CONFIRMAR QUE:
--    1. Todos los usuarios han sido migrados a la tabla `users`
--    2. El login tradicional funciona con local_auth
--    3. El login con Google funciona con oauth_auth
--    4. Se ha hecho BACKUP de la base de datos
-- ============================================================

-- Hacer backup primero (descomentar si se ejecuta manualmente)
-- CREATE TABLE user_login_backup AS SELECT * FROM user_login;

-- Eliminar tabla antigua
DROP TABLE IF EXISTS user_login;
