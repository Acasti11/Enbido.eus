-- ============================================================
-- ENBIDO DB SCHEMA v2 — Tabla users (soporte email + Google OAuth)
-- ============================================================

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

CREATE TABLE IF NOT EXISTS categories (
    category_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(250)
);

CREATE TABLE IF NOT EXISTS items (
    item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT,
    name VARCHAR(100) NOT NULL,
    price INT UNSIGNED NOT NULL
);

ALTER TABLE items 
    ADD CONSTRAINT items_categories_FK FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS user_game_profile (
    user_id BIGINT PRIMARY KEY,
    elo INT DEFAULT 200, 
    coins INT UNSIGNED DEFAULT 0,
    total_games_played INT DEFAULT 0,
    total_games_won INT DEFAULT 0,
    equipped_avatar_item_id BIGINT NULL,
    equipped_deck_item_id BIGINT NULL,
    equipped_title_item_id BIGINT NULL,
    equipped_board_item_id BIGINT NULL,
    music_enabled BOOLEAN DEFAULT TRUE,
    music_volume DOUBLE DEFAULT 0.5,
    sound_enabled BOOLEAN DEFAULT TRUE,
    sound_volume DOUBLE DEFAULT 0.5,
    view_mode VARCHAR(10) DEFAULT '2d',
    language VARCHAR(5) DEFAULT 'es',
    notifications_enabled BOOLEAN DEFAULT TRUE
);

ALTER TABLE user_game_profile
    ADD CONSTRAINT user_game_profile_users_FK FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    ADD CONSTRAINT user_game_profile_avatar_item_FK FOREIGN KEY (equipped_avatar_item_id) REFERENCES items (item_id) ON DELETE SET NULL,
    ADD CONSTRAINT user_game_profile_deck_item_FK FOREIGN KEY (equipped_deck_item_id) REFERENCES items (item_id) ON DELETE SET NULL,
    ADD CONSTRAINT user_game_profile_title_item_FK FOREIGN KEY (equipped_title_item_id) REFERENCES items (item_id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS user_inventory (
    user_id BIGINT, 
    item_id BIGINT,
    PRIMARY KEY (user_id, item_id)
);

ALTER TABLE user_inventory
    ADD CONSTRAINT user_inventory_items_FK FOREIGN KEY (item_id) REFERENCES items (item_id) ON DELETE CASCADE,
    ADD CONSTRAINT user_inventory_users_FK FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS purchase_history (
    purchase_history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT, 
    item_id BIGINT NULL,
    coins_spent INT UNSIGNED NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE purchase_history 
    ADD CONSTRAINT purchase_history_users_FK FOREIGN KEY (user_id) REFERENCES users (user_id),
    ADD CONSTRAINT purchase_history_items_FK FOREIGN KEY (item_id) REFERENCES items (item_id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS tournaments (
    tournament_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS game_mode (
    game_mode_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description varchar(200)
);

CREATE TABLE IF NOT EXISTS game_states (
    game_state_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description varchar(200)
);


CREATE TABLE IF NOT EXISTS play_game (
    game_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    player1 BIGINT, 
    player2 BIGINT, 
    player3 BIGINT, 
    player4 BIGINT,
    game_state_id BIGINT, 
    game_mode_id BIGINT,
    points_team_12 INT DEFAULT 0,
    points_team_34 INT DEFAULT 0,
    total_time_seconds INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tournament_id BIGINT NULL 
);

ALTER TABLE play_game
    ADD CONSTRAINT play_game1_users_FK FOREIGN KEY (player1) REFERENCES users (user_id),
    ADD CONSTRAINT play_game2_users_FK FOREIGN KEY (player2) REFERENCES users (user_id),
    ADD CONSTRAINT play_game3_users_FK FOREIGN KEY (player3) REFERENCES users (user_id),
    ADD CONSTRAINT play_game4_users_FK FOREIGN KEY (player4) REFERENCES users (user_id),
    ADD CONSTRAINT play_game_game_states_FK FOREIGN KEY (game_state_id) REFERENCES game_states (game_state_id),
    ADD CONSTRAINT play_game_game_mode_FK FOREIGN KEY (game_mode_id) REFERENCES game_mode (game_mode_id),
    ADD CONSTRAINT play_game_tournaments_FK FOREIGN KEY (tournament_id) REFERENCES tournaments (tournament_id);


CREATE TABLE IF NOT EXISTS tournament_participant (
    tournament_id BIGINT, 
    user_id BIGINT,        
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tournament_participant
    ADD CONSTRAINT tournament_participant_PK PRIMARY KEY (tournament_id, user_id),
    ADD CONSTRAINT tournament_participant_tournaments_FK FOREIGN KEY (tournament_id) REFERENCES tournaments (tournament_id) ON DELETE CASCADE,
    ADD CONSTRAINT tournament_participant_users_FK FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS chat (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_id BIGINT,
    content TEXT, 
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT 
);

ALTER TABLE chat   
    ADD CONSTRAINT chat_play_game_FK FOREIGN KEY (game_id) REFERENCES play_game (game_id) ON DELETE CASCADE,
    ADD CONSTRAINT chat_users_FK FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS matchmaking_queue (
    queue_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT, 
    looking_for ENUM ('partner', 'opponent') DEFAULT 'partner',
    game_mode_id BIGINT, 
    status ENUM('searching', 'cancelled', 'matched') DEFAULT 'searching',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE matchmaking_queue
    ADD CONSTRAINT matchmaking_queue_users_FK FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    ADD CONSTRAINT matchmaking_queue_game_mode_FK FOREIGN KEY (game_mode_id) REFERENCES game_mode (game_mode_id);


CREATE TABLE IF NOT EXISTS physical_tournament (
    tournament_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organizer_id BIGINT,
    title VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    specific_location VARCHAR(255),
    start_datetime DATETIME,
    entry_fee DECIMAL(10,2) DEFAULT 0,
    max_teams INT,
    status ENUM('open', 'playing', 'finished', 'cancelled') DEFAULT 'open',
    type ENUM('ONLINE', 'PRESENCIAL') DEFAULT 'PRESENCIAL',
    finished_at DATETIME,
    coins_fee INT DEFAULT 0,
    coins_reward INT DEFAULT 0
);

ALTER TABLE physical_tournament
    ADD CONSTRAINT physical_tournament_users_FK FOREIGN KEY (organizer_id) REFERENCES users (user_id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS physical_tournament_participant (
    tournament_id BIGINT,
    user_id BIGINT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tournament_id, user_id),
    FOREIGN KEY (tournament_id) REFERENCES physical_tournament (tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS physical_tournament_match (
    match_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tournament_id BIGINT,
    round_number INT,
    match_index INT,
    player1_id BIGINT NULL,
    player2_id BIGINT NULL,
    player1_partner_id BIGINT NULL,
    player2_partner_id BIGINT NULL,
    player1_ready BOOLEAN DEFAULT FALSE,
    player2_ready BOOLEAN DEFAULT FALSE,
    player1_partner_ready BOOLEAN DEFAULT FALSE,
    player2_partner_ready BOOLEAN DEFAULT FALSE,
    round_start_time TIMESTAMP NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    game_room_id VARCHAR(100) NULL,
    winner_id BIGINT NULL,
    score VARCHAR(20) DEFAULT '',
    FOREIGN KEY (tournament_id) REFERENCES physical_tournament (tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (player1_id) REFERENCES users (user_id) ON DELETE SET NULL,
    FOREIGN KEY (player2_id) REFERENCES users (user_id) ON DELETE SET NULL,
    FOREIGN KEY (player1_partner_id) REFERENCES users (user_id) ON DELETE SET NULL,
    FOREIGN KEY (player2_partner_id) REFERENCES users (user_id) ON DELETE SET NULL,
    FOREIGN KEY (winner_id) REFERENCES users (user_id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS physical_tournament_team (
    team_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tournament_id BIGINT,
    player_1_id BIGINT, 
    player_2_id BIGINT, 
    team_name VARCHAR(100),
    is_paid BOOLEAN DEFAULT FALSE,
    CHECK (player_1_id <> player_2_id)
);

ALTER TABLE physical_tournament_team
    ADD CONSTRAINT physical_tournament_team_physical_tournament_FK FOREIGN KEY (tournament_id) REFERENCES physical_tournament (tournament_id) ON DELETE CASCADE,
    ADD CONSTRAINT physical_tournament_team_users_1_FK FOREIGN KEY (player_1_id) REFERENCES users (user_id) ON DELETE CASCADE,
    ADD CONSTRAINT physical_tournament_team_users_2_FK FOREIGN KEY (player_2_id) REFERENCES users (user_id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS local_meetup_ad (
    ad_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    creator_id BIGINT, 
    location VARCHAR(255),
    latitude DOUBLE NULL,
    longitude DOUBLE NULL,
    missing_players INT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    scheduled_at TIMESTAMP NULL,
    establishment_type VARCHAR(50) DEFAULT 'BAR'
);

ALTER TABLE local_meetup_ad
    ADD CONSTRAINT local_meetup_ad_users_FK FOREIGN KEY (creator_id) REFERENCES users (user_id);


CREATE TABLE IF NOT EXISTS meetup_request (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ad_id BIGINT, 
    applicant_id BIGINT, 
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending'
);

ALTER TABLE meetup_request
    ADD CONSTRAINT meetup_request_local_meetup_ad_FK FOREIGN KEY (ad_id) REFERENCES local_meetup_ad (ad_id) ON DELETE CASCADE,
    ADD CONSTRAINT meetup_request_users_FK FOREIGN KEY (applicant_id) REFERENCES users (user_id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS game_action_log (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_id BIGINT,
    user_id BIGINT, 
    action TEXT NOT NULL,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE game_action_log
    ADD CONSTRAINT game_action_log_play_game_FK FOREIGN KEY (game_id) REFERENCES play_game(game_id) ON DELETE CASCADE,
    ADD CONSTRAINT game_action_log_users_FK FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS friendships (
    friendship_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id_1 BIGINT,
    user_id_2 BIGINT,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    CHECK (user_id_1 <> user_id_2)
);

ALTER TABLE friendships
    ADD CONSTRAINT friendships_users_1_FK FOREIGN KEY (user_id_1) REFERENCES users (user_id) ON DELETE CASCADE,
    ADD CONSTRAINT friendships_users_2_FK FOREIGN KEY (user_id_2) REFERENCES users (user_id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS game_matches (
    game_matches_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    score_us INT DEFAULT 0,
    score_them INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


CREATE TABLE IF NOT EXISTS meetup_participants (
    meetup_participants_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ad_id BIGINT,
    user_id BIGINT,
    FOREIGN KEY (ad_id) REFERENCES local_meetup_ad(ad_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS meetup_messages (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ad_id BIGINT,
    user_id BIGINT,
    content TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_id) REFERENCES local_meetup_ad(ad_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS direct_messages (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- Insertar valores maestros por defecto
INSERT IGNORE INTO game_mode (game_mode_id, name, description) VALUES (1, 'Normal 4 Jugadores', 'Partida de Mus standard con 4 jugadores o bots');
INSERT IGNORE INTO game_states (game_state_id, name, description) VALUES 
(1, 'En Progreso', 'Partida en juego actualmente'),
(2, 'Finalizada', 'Partida terminada por llegar a 30 puntos'),
(3, 'Abandonada', 'Partida cancelada por abandono');

-- Insertar categorías y artículos de la tienda
INSERT IGNORE INTO categories (category_id, name, description) VALUES 
(1, 'profiles', 'Profilak / Perfiles'), 
(2, 'decks', 'Kartak / Cartas'), 
(3, 'aliases', 'Ezizenak / Alias');

INSERT IGNORE INTO items (item_id, category_id, name, price) VALUES 
(1, 1, 'Perfil Txapeldun', 850), 
(2, 1, 'Perfil Fronton', 620), 
(3, 2, 'Baraja Euskal', 1200), 
(4, 2, 'Baraja Gau Beltza', 1450), 
(5, 3, 'Handia', 350), 
(6, 3, 'Enbido Maisu', 700),
(7, 1, 'Perfil Ikurriña', 900),
(8, 1, 'Perfil Karta', 500),
(9, 2, 'Baraja Klasikoa', 600),
(10, 2, 'Baraja Berezia', 1500),
(11, 3, 'Txapeldun', 800),
(12, 3, 'Musolari', 400),
(13, 3, 'Zazpi eta Erdi', 300);

-- Insertar usuarios de prueba en la nueva tabla users + local_auth
INSERT IGNORE INTO users (user_id, name, email, username, role, is_banned) VALUES 
(100, 'Mikel', 'mikel@email.com', 'mikel', 'user', FALSE), 
(101, 'Ane', 'ane@email.com', 'ane', 'user', FALSE), 
(102, 'Jon', 'jon@email.com', 'jon', 'user', FALSE), 
(103, 'Gorka', 'gorka@email.com', 'gorka', 'user', FALSE), 
(104, 'Amaia', 'amaia@email.com', 'amaia', 'user', FALSE), 
(105, 'Ander', 'ander@email.com', 'ander', 'user', FALSE), 
(106, 'Irati', 'irati@email.com', 'irati', 'user', FALSE), 
(107, 'Koldo', 'koldo@email.com', 'koldo', 'user', FALSE);

INSERT IGNORE INTO local_auth (user_id, password) VALUES
(100, '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK'),
(101, '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK'),
(102, '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK'),
(103, '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK'),
(104, '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK'),
(105, '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK'),
(106, '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK'),
(107, '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK');

-- Insertar perfiles de juego para los usuarios
INSERT IGNORE INTO user_game_profile (user_id, elo, coins, total_games_played, total_games_won) VALUES 
(100, 240, 1000, 20, 12), 
(101, 280, 1200, 25, 18), 
(102, 220, 800, 15, 7), 
(103, 250, 1500, 30, 19), 
(104, 210, 500, 10, 4), 
(105, 190, 300, 8, 3), 
(106, 260, 900, 18, 11), 
(107, 235, 750, 22, 12);

-- Insertar torneos de prueba
INSERT IGNORE INTO physical_tournament (tournament_id, organizer_id, title, city, specific_location, start_datetime, entry_fee, max_teams, status, type, finished_at, coins_fee, coins_reward) VALUES 
(100, 100, 'Gran Copa Euskal Herria', 'Donostia', 'Gros Kiroldegia', '2026-06-15 18:00:00', 0, 8, 'open', 'PRESENCIAL', NULL, 50, 400), 
(101, 101, 'Kopa Bilbo Mus', 'Bilbo', 'Kasko Zaharra Cafe', '2026-05-30 19:30:00', 0, 8, 'playing', 'PRESENCIAL', NULL, 100, 800),
(102, 100, 'Txapelketa Gasteiz', 'Gasteiz', 'Zabalgana Kultur Etxea', '2026-05-20 17:00:00', 0, 8, 'finished', 'PRESENCIAL', '2026-05-20 20:00:00', 75, 600),
(103, 102, 'Torneo Rápido Eibar', 'Eibar', 'Unzaga Plaza Taberna', '2026-06-10 20:00:00', 0, 8, 'open', 'PRESENCIAL', NULL, 40, 300);

-- Insertar participantes de los torneos
INSERT IGNORE INTO physical_tournament_participant (tournament_id, user_id) VALUES 
(100, 100), (100, 101), (100, 102), (100, 103),
(101, 100), (101, 101), (101, 102), (101, 103), (101, 104), (101, 105), (101, 106), (101, 107),
(102, 100), (102, 101), (102, 102), (102, 103), (102, 104), (102, 105), (102, 106), (102, 107),
(103, 100), (103, 101), (103, 102), (103, 103), (103, 104), (103, 105), (103, 106);

-- Insertar emparejamientos/llaves del torneo 101 (En Juego)
INSERT IGNORE INTO physical_tournament_match (match_id, tournament_id, round_number, match_index, player1_id, player2_id, winner_id, score) VALUES 
(1, 101, 1, 0, 100, 101, 100, '3-1'),
(2, 101, 1, 1, 102, 103, 103, '3-2'),
(3, 101, 1, 2, 104, 105, 104, '3-0'),
(4, 101, 1, 3, 106, 107, NULL, ''),
(5, 101, 2, 0, 100, 103, NULL, ''),
(6, 101, 2, 1, 104, NULL, NULL, ''),
(7, 101, 3, 0, NULL, NULL, NULL, '');

-- Insertar emparejamientos/llaves del torneo 102 (Finalizado)
INSERT IGNORE INTO physical_tournament_match (match_id, tournament_id, round_number, match_index, player1_id, player2_id, winner_id, score) VALUES 
(8, 102, 1, 0, 100, 101, 101, '3-2'),
(9, 102, 1, 1, 102, 103, 102, '3-1'),
(10, 102, 1, 2, 104, 105, 105, '3-0'),
(11, 102, 1, 3, 106, 107, 106, '3-1'),
(12, 102, 2, 0, 101, 102, 101, '3-0'),
(13, 102, 2, 1, 105, 106, 105, '3-2'),
(14, 102, 3, 0, 101, 105, 101, '3-1');


-- ==========================================
-- ÍNDICES DE RENDIMIENTO (ACCESO EFICIENTE)
-- ==========================================
CREATE INDEX idx_user_game_profile_elo ON user_game_profile(elo DESC);
CREATE INDEX idx_local_meetup_ad_active ON local_meetup_ad(is_active);

-- ==========================================
-- PROCEDIMIENTOS ALMACENADOS (PL/SQL)
-- ==========================================
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

-- ==========================================
-- PROCEDIMIENTOS DE EJECUCIÓN AUTOMÁTICA (TRIGGERS)
-- ==========================================
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
