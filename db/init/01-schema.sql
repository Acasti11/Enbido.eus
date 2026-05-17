CREATE TABLE user_login (
    user_id BIGINT AUTO_INCREMENT,
    name VARCHAR(100),
    surname VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    postal_code VARCHAR(20),
    username VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    is_banned TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_user_login PRIMARY KEY (user_id),
    CONSTRAINT uq_user_login_email UNIQUE (email),
    CONSTRAINT uq_user_login_username UNIQUE (username)
);
INSERT INTO user_login (name, surname, email, password, phone_number, postal_code, username)
VALUES ('Juan', 'García', 'juan@email.com', 'hashedpass', '+34600123456', '28001', 'juangarcia');