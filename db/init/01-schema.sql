CREATE TABLE IF NOT EXISTS user_login (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    postal_code VARCHAR(20),
    username VARCHAR(50) UNIQUE NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_banned BOOLEAN DEFAULT FALSE,
    birth_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(250)
);

CREATE TABLE IF NOT EXISTS items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    price INT UNSIGNED NOT NULL
);

ALTER TABLE items 
    ADD CONSTRAINT  items_categoies_FK FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS user_game_profile (
    user_id INT PRIMARY KEY,
    elo INT DEFAULT 200, 
    coins INT UNSIGNED DEFAULT 0,
    total_games_played INT DEFAULT 0,
    total_games_won INT DEFAULT 0,
    equipped_avatar_item_id INT NULL,
    equipped_deck_item_id INT NULL,
    equipped_title_item_id INT NULL,
    equipped_board_item_id INT NULL,
    music_enabled BOOLEAN DEFAULT TRUE,
    music_volume DOUBLE DEFAULT 0.5,
    sound_enabled BOOLEAN DEFAULT TRUE,
    sound_volume DOUBLE DEFAULT 0.5,
    view_mode VARCHAR(10) DEFAULT '2d',
    language VARCHAR(5) DEFAULT 'es',
    notifications_enabled BOOLEAN DEFAULT TRUE
);

ALTER TABLE user_game_profile
    ADD CONSTRAINT user_game_profile_user_login_FK FOREIGN KEY (user_id) REFERENCES user_login (user_id) ON DELETE CASCADE,
    ADD CONSTRAINT user_game_profile_avatar_item_FK FOREIGN KEY (equipped_avatar_item_id) REFERENCES items (item_id) ON DELETE SET NULL,
    ADD CONSTRAINT user_game_profile_deck_item_FK FOREIGN KEY (equipped_deck_item_id) REFERENCES items (item_id) ON DELETE SET NULL,
    ADD CONSTRAINT user_game_profile_title_item_FK FOREIGN KEY (equipped_title_item_id) REFERENCES items (item_id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS user_inventory (
    user_id INT, 
    item_id INT,
    PRIMARY KEY (user_id, item_id)
);

ALTER TABLE user_inventory
    ADD CONSTRAINT user_inventory_items_FK  FOREIGN KEY (item_id) REFERENCES items (item_id) ON DELETE CASCADE,
    ADD CONSTRAINT user_inventory_user_login_FK  FOREIGN KEY (user_id) REFERENCES user_login (user_id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS purchase_history (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT, 
    item_id INT NULL,
    coins_spent INT UNSIGNED NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE purchase_history 
    ADD CONSTRAINT purchase_history_user_login_FK FOREIGN KEY (user_id) REFERENCES user_login (user_id),
    ADD CONSTRAINT purchase_history_items_FK FOREIGN KEY (item_id) REFERENCES items (item_id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS tournaments (
    tournament_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS game_mode (
    game_mode_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description varchar(200)
);
CREATE TABLE IF NOT EXISTS game_states (
    game_state_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description varchar(200)
);


CREATE TABLE IF NOT EXISTS play_game (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    player1 INT, 
    player2 INT, 
    player3 INT, 
    player4 INT,
    game_state_id INT, 
    game_mode_id INT,
    points_team_12 INT DEFAULT 0,
    points_team_34 INT DEFAULT 0,
    total_time_seconds INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tournament_id INT NULL 
);

ALTER TABLE play_game
    ADD CONSTRAINT play_game1_user_login_FK FOREIGN KEY (player1) REFERENCES user_login (user_id),
    ADD CONSTRAINT play_game2_user_login_FK FOREIGN KEY (player2) REFERENCES user_login (user_id),
    ADD CONSTRAINT play_game3_user_login_FK FOREIGN KEY (player3) REFERENCES user_login (user_id),
    ADD CONSTRAINT play_game4_user_login_FK FOREIGN KEY (player4) REFERENCES user_login (user_id),
    ADD CONSTRAINT play_game_game_states_FK FOREIGN KEY (game_state_id) REFERENCES game_states (game_state_id),
    ADD CONSTRAINT play_game_game_mode_FK FOREIGN KEY (game_mode_id) REFERENCES game_mode (game_mode_id),
    ADD CONSTRAINT play_game_tournaments_FK FOREIGN KEY (tournament_id) REFERENCES tournaments (tournament_id);



CREATE TABLE IF NOT EXISTS tournament_participant (
    tournament_id INT, 
    user_id INT,        
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tournament_participant
    ADD CONSTRAINT tournament_participant_PK PRIMARY KEY (tournament_id,user_id),
    ADD CONSTRAINT tournament_participant_tournaments_FK FOREIGN KEY (tournament_id) REFERENCES tournaments (tournament_id) ON DELETE CASCADE,
    ADD CONSTRAINT tournament_participant_user_login_FK FOREIGN KEY (user_id) REFERENCES user_login (user_id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS chat (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT,
    content TEXT, 
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT 
);

ALTER TABLE chat   
    ADD CONSTRAINT chat_play_game_FK FOREIGN KEY (game_id) REFERENCES play_game (game_id) ON DELETE CASCADE,
    ADD CONSTRAINT chat_user_login_FK FOREIGN KEY (user_id) REFERENCES user_login (user_id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS matchmaking_queue (
    queue_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT, 
    looking_for ENUM ('partner', 'opponent') DEFAULT 'partner',
    game_mode_id INT, 
    status ENUM('searching', 'cancelled', 'matched') DEFAULT 'searching',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE matchmaking_queue
    ADD CONSTRAINT matchmaking_queue_user_login_FK FOREIGN KEY (user_id) REFERENCES user_login (user_id) ON DELETE CASCADE,
    ADD CONSTRAINT matchmaking_queue_game_mode_FK FOREIGN KEY (game_mode_id) REFERENCES game_mode (game_mode_id);

CREATE TABLE IF NOT EXISTS physical_tournament (
    tournament_id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT,
    title VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    specific_location VARCHAR(255),
    start_datetime DATETIME,
    entry_fee DECIMAL(10,2) DEFAULT 0,
    max_teams INT,
    status ENUM('open', 'playing', 'finished', 'cancelled') DEFAULT 'open',
    coins_fee INT DEFAULT 0,
    coins_reward INT DEFAULT 0
);

ALTER TABLE physical_tournament
    ADD CONSTRAINT physical_tournament_user_login_FK FOREIGN KEY (organizer_id) REFERENCES user_login (user_id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS physical_tournament_participant (
    tournament_id INT,
    user_id INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tournament_id, user_id),
    FOREIGN KEY (tournament_id) REFERENCES physical_tournament (tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_login (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS physical_tournament_match (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT,
    round_number INT,
    match_index INT,
    player1_id INT NULL,
    player2_id INT NULL,
    winner_id INT NULL,
    score VARCHAR(20) DEFAULT '',
    FOREIGN KEY (tournament_id) REFERENCES physical_tournament (tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (player1_id) REFERENCES user_login (user_id) ON DELETE SET NULL,
    FOREIGN KEY (player2_id) REFERENCES user_login (user_id) ON DELETE SET NULL,
    FOREIGN KEY (winner_id) REFERENCES user_login (user_id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS physical_tournament_team (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id  INT,
    player_1_id INT, 
    player_2_id INT, 
    team_name VARCHAR(100),
    is_paid BOOLEAN DEFAULT FALSE,
    CHECK (player_1_id <> player_2_id)

);

ALTER TABLE physical_tournament_team
    ADD CONSTRAINT physical_tournament_team_physical_tournament_FK FOREIGN KEY (tournament_id) REFERENCES physical_tournament (tournament_id) ON DELETE CASCADE,
    ADD CONSTRAINT physical_tournament_team_user_login_1_FK FOREIGN KEY (player_1_id) REFERENCES user_login (user_id) ON DELETE CASCADE,
    ADD CONSTRAINT physical_tournament_team_user_login_2_FK FOREIGN KEY (player_2_id) REFERENCES user_login (user_id) ON DELETE CASCADE;





CREATE TABLE IF NOT EXISTS local_meetup_ad (
    ad_id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id  INT, 
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
    ADD CONSTRAINT local_meetup_ad_user_login_FK FOREIGN KEY (creator_id) REFERENCES user_login (user_id);

CREATE TABLE IF NOT EXISTS meetup_request (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    ad_id INT, 
    applicant_id INT, 
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending'
);

ALTER TABLE meetup_request
    ADD CONSTRAINT meetup_request_local_meetup_ad_FK FOREIGN KEY  (ad_id) REFERENCES local_meetup_ad (ad_id) ON DELETE CASCADE,
    ADD CONSTRAINT meetup_request_user_login_FK FOREIGN KEY (applicant_id) REFERENCES user_login (user_id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS game_action_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT,
    user_id INT, 
    action TEXT NOT NULL,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE game_action_log
    ADD CONSTRAINT game_action_log_play_game_FK FOREIGN KEY (game_id) REFERENCES play_game(game_id) ON DELETE CASCADE,
    ADD CONSTRAINT game_action_log_user_login_FK FOREIGN KEY (user_id) REFERENCES user_login (user_id) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS friendships (
    friendship_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id_1 INT,
    user_id_2 INT ,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    CHECK (user_id_1 <> user_id_2)

);

ALTER TABLE friendships
    ADD CONSTRAINT friendships_user_login_1_FK FOREIGN KEY (user_id_1) REFERENCES user_login (user_id) ON DELETE CASCADE,
    ADD CONSTRAINT friendships_user_login_2_FK FOREIGN KEY (user_id_2) REFERENCES user_login (user_id) ON DELETE CASCADE;

INSERT INTO user_login (name, email, password, username, birth_date) VALUES ('Juan', 'juan@email.com', '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK', 'juanito', '1990-01-01');

CREATE TABLE IF NOT EXISTS game_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    score_us INT DEFAULT 0,
    score_them INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    FOREIGN KEY (user_id) REFERENCES user_login(user_id)
);

CREATE TABLE IF NOT EXISTS meetup_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ad_id INT,
    user_id INT,
    FOREIGN KEY (ad_id) REFERENCES local_meetup_ad(ad_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_login(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meetup_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    ad_id INT,
    user_id INT,
    content TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_id) REFERENCES local_meetup_ad(ad_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_login(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS direct_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES user_login(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES user_login(user_id) ON DELETE CASCADE
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
(6, 3, 'Enbido Maisu', 700);

-- Insertar usuarios de prueba
INSERT IGNORE INTO user_login (user_id, name, email, password, username, birth_date) VALUES 
(100, 'Mikel', 'mikel@email.com', '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK', 'mikel', '1995-05-12'), 
(101, 'Ane', 'ane@email.com', '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK', 'ane', '1997-08-22'), 
(102, 'Jon', 'jon@email.com', '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK', 'jon', '1994-03-15'), 
(103, 'Gorka', 'gorka@email.com', '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK', 'gorka', '1996-11-02'), 
(104, 'Amaia', 'amaia@email.com', '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK', 'amaia', '1998-02-14'), 
(105, 'Ander', 'ander@email.com', '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK', 'ander', '1993-07-19'), 
(106, 'Irati', 'irati@email.com', '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK', 'irati', '1995-09-30'), 
(107, 'Koldo', 'koldo@email.com', '$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK', 'koldo', '1992-12-05');

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
INSERT IGNORE INTO physical_tournament (tournament_id, organizer_id, title, city, specific_location, start_datetime, entry_fee, max_teams, status, coins_fee, coins_reward) VALUES 
(100, 100, 'Gran Copa Euskal Herria', 'Donostia', 'Gros Kiroldegia', '2026-06-15 18:00:00', 0, 8, 'open', 50, 400), 
(101, 101, 'Kopa Bilbo Mus', 'Bilbo', 'Kasko Zaharra Cafe', '2026-05-30 19:30:00', 0, 8, 'playing', 100, 800);

-- Insertar participantes de los torneos
INSERT IGNORE INTO physical_tournament_participant (tournament_id, user_id) VALUES 
(100, 100), (100, 101), (100, 102), (100, 103),
(101, 100), (101, 101), (101, 102), (101, 103), (101, 104), (101, 105), (101, 106), (101, 107);

-- Insertar emparejamientos/llaves del torneo 101
INSERT IGNORE INTO physical_tournament_match (match_id, tournament_id, round_number, match_index, player1_id, player2_id, winner_id, score) VALUES 
(1, 101, 1, 0, 100, 101, 100, '3-1'),
(2, 101, 1, 1, 102, 103, 103, '3-2'),
(3, 101, 1, 2, 104, 105, 104, '3-0'),
(4, 101, 1, 3, 106, 107, NULL, ''),
(5, 101, 2, 0, 100, 103, NULL, ''),
(6, 101, 2, 1, 104, NULL, NULL, ''),
(7, 101, 3, 0, NULL, NULL, NULL, '');