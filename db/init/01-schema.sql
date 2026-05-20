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
    equipped_title_item_id INT NULL
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
    status ENUM('open', 'playing', 'finished', 'cancelled') DEFAULT 'open'
);

ALTER TABLE physical_tournament
    ADD CONSTRAINT physical_tournament_user_login_FK FOREIGN KEY (organizer_id) REFERENCES user_login (user_id) ON DELETE SET NULL;


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
    missing_players INT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
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

INSERT INTO user_login (name, email, password, username, birth_date) VALUES ('Juan', 'juan@email.com', '1234', 'juanito', '1990-01-01');







CREATE TABLE IF NOT EXISTS game_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    score_us INT DEFAULT 0,
    score_them INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    FOREIGN KEY (user_id) REFERENCES user_login(user_id)
);

-- Insertar valores maestros por defecto
INSERT IGNORE INTO game_mode (game_mode_id, name, description) VALUES (1, 'Normal 4 Jugadores', 'Partida de Mus standard con 4 jugadores o bots');
INSERT IGNORE INTO game_states (game_state_id, name, description) VALUES 
(1, 'En Progreso', 'Partida en juego actualmente'),
(2, 'Finalizada', 'Partida terminada por llegar a 30 puntos'),
(3, 'Abandonada', 'Partida cancelada por abandono');