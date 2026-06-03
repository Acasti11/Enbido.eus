-- ============================================================
-- Tabla: users — identidad del usuario
-- ============================================================
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

-- ============================================================
-- Tabla: local_auth — login email/password
-- Relación 1:1 opcional con users
-- ============================================================
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

-- ============================================================
-- Tabla: oauth_auth — login Google y futuros proveedores
-- Relación 1:N con users (un usuario puede tener varios OAuth)
-- ============================================================
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
