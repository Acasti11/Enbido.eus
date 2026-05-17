
CREATE TABLE IF NOT EXISTS user_login (
    user_ID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    postal_code VARCHAR(20),
    username VARCHAR(50) UNIQUE NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS categories (
    category_ID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(250)
);

CREATE TABLE IF NOT EXISTS items (
    item_ID INT AUTO_INCREMENT PRIMARY KEY,
    category_ID INT, --fk de categories
    name VARCHAR(100) NOT NULL,
    price INT UNSIGNED NOT NULL
);

ALTER TABLE items 
    ADD CONSTRAINT  items_categoies_FK FOREIGN KEY (category_ID) REFERENCES categories(category_ID) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS user_game_profile (
    user_ID INT PRIMARY KEY, --fk de user_login
    elo INT DEFAULT 1000, -- nose si 1000 valore egoki bat dan
    coins INT UNSIGNED DEFAULT 0,
    total_games_played INT DEFAULT 0,
    total_games_won INT DEFAULT 0,
    equipped_avatar_item_id INT NULL,
    equipped_deck_item_id INT NULL,
    equipped_title_item_id INT NULL
);

ALTER TABLE user_game_profile
    ADD CONSTRAINT user_game_profile_user_login_FK FOREIGN KEY (user_ID) REFERENCES user_login (user_ID) ON DELETE CASCADE,
    ADD CONSTRAINT user_game_profile_avatar_item_FK FOREIGN KEY (equipped_avatar_item_id) REFERENCES items (item_ID) ON DELETE SET NULL,
    ADD CONSTRAINT user_game_profile_deck_item_FK FOREIGN KEY (equipped_deck_item_id) REFERENCES items (item_ID) ON DELETE SET NULL,
    ADD CONSTRAINT user_game_profile_title_item_FK FOREIGN KEY (equipped_title_item_id) REFERENCES items (item_ID) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS user_inventory (
    user_ID INT, --fk de user_login
    item_ID INT, --fk de items
    PRIMARY KEY (user_ID, item_ID)
);

ALTER TABLE user_inventory
    ADD CONSTRAINT user_inventory_items_FK  FOREIGN KEY (item_ID) REFERENCES items (item_ID) ON DELETE CASCADE,
    ADD CONSTRAINT user_inventory_user_login_FK  FOREIGN KEY (user_ID) REFERENCES user_login (user_ID) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS purchase_history (
    transaction_ID INT AUTO_INCREMENT PRIMARY KEY,
    user_ID INT, --fk de user_login
    item_ID INT NULL, --fk de items
    coins_spent INT UNSIGNED NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE purchase_history 
    ADD CONSTRAINT purchase_history_user_login_FK FOREIGN KEY (user_ID) REFERENCES user_login (user_ID),
    ADD CONSTRAINT purchase_history_items_FK FOREIGN KEY (item_ID) REFERENCES items (item_ID) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS tournaments (
    tournament_ID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS game_mode (
    game_mode_ID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description varchar(200)
);
CREATE TABLE IF NOT EXISTS game_states (
    game_state_ID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description varchar(200)
);


CREATE TABLE IF NOT EXISTS play_game (
    game_ID INT AUTO_INCREMENT PRIMARY KEY,
    player1 INT, --fk de user_login
    player2 INT, --fk de user_login
    player3 INT, --fk de user_login
    player4 INT, --fk de user_login
    game_state_ID INT, --fk de game_states
    game_mode_ID INT, --fk de game_mode
    points_team_12 INT DEFAULT 0,
    points_team_34 INT DEFAULT 0,
    total_time_seconds INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tournament_ID INT NULL --fk de tournaments
);

ALTER TABLE play_game
    ADD CONSTRAINT play_game1_user_login_FK FOREIGN KEY (player1) REFERENCES user_login (user_ID),
    ADD CONSTRAINT play_game2_user_login_FK FOREIGN KEY (player2) REFERENCES user_login (user_ID),
    ADD CONSTRAINT play_game3_user_login_FK FOREIGN KEY (player3) REFERENCES user_login (user_ID),
    ADD CONSTRAINT play_game4_user_login_FK FOREIGN KEY (player4) REFERENCES user_login (user_ID),
    ADD CONSTRAINT play_game_game_states_FK FOREIGN KEY (game_state_ID) REFERENCES game_states (game_state_ID),
    ADD CONSTRAINT play_game_game_mode_FK FOREIGN KEY (game_mode_ID) REFERENCES game_mode (game_mode_ID),
    ADD CONSTRAINT play_game_tournaments_FK FOREIGN KEY (tournament_ID) REFERENCES tournaments (tournament_ID);



CREATE TABLE IF NOT EXISTS tournament_participant (
    tournament_ID INT,  -- FK de tournaments
    user_ID INT,        -- FK de user_login
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tournament_participant
    ADD CONSTRAINT tournament_participant_PK PRIMARY KEY (tournament_ID,user_ID),
    ADD CONSTRAINT tournament_participant_tournaments_FK FOREIGN KEY (tournament_ID) REFERENCES tournaments (tournament_ID) ON DELETE CASCADE,
    ADD CONSTRAINT tournament_participant_user_login_FK FOREIGN KEY (user_ID) REFERENCES user_login (user_ID) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS chat (
    message_ID INT AUTO_INCREMENT PRIMARY KEY,
    game_ID INT, --fk de play_game
    content TEXT, 
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_ID INT -- fk de user_login
);

ALTER TABLE chat   
    ADD CONSTRAINT chat_play_game_FK FOREIGN KEY (game_ID) REFERENCES play_game (game_ID) ON DELETE CASCADE,
    ADD CONSTRAINT chat_user_login_FK FOREIGN KEY (user_ID) REFERENCES user_login (user_ID) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS matchmaking_queue (
    queue_ID INT AUTO_INCREMENT PRIMARY KEY,
    user_ID INT, -- fk de user_login
    looking_for ENUM ('partner', 'opponent') DEFAULT 'partner',
    game_mode_ID INT, --fk de game_mode
    status ENUM('searching', 'cancelled', 'matched') DEFAULT 'searching',
    --hau gehitu det, nik uste garrantzitsua dala , gero garbitzeko kola o lo que sea
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE matchmaking_queue
    ADD CONSTRAINT matchmaking_queue_user_login_FK FOREIGN KEY (user_ID) REFERENCES user_login (user_ID) ON DELETE CASCADE,
    ADD CONSTRAINT matchmaking_queue_game_mode_FK FOREIGN KEY (game_mode_ID) REFERENCES game_mode (game_mode_ID);

CREATE TABLE IF NOT EXISTS physical_tournament (
    tournament_ID INT AUTO_INCREMENT PRIMARY KEY,
    organizer_ID INT, --fk de user_login
    title VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    specific_location VARCHAR(255),
    start_datetime DATETIME,
    entry_fee DECIMAL(10,2) DEFAULT 0,
    max_teams INT,
    status ENUM('open', 'playing', 'finished', 'cancelled') DEFAULT 'open'
);

ALTER TABLE physical_tournament
    ADD CONSTRAINT physical_tournament_user_login_FK FOREIGN KEY (organizer_ID) REFERENCES user_login (user_ID) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS physical_tournament_team (
    team_ID INT AUTO_INCREMENT PRIMARY KEY,
    tournament_ID  INT, --fk de physical tournament
    player_1_ID INT, -- fk user_login
    player_2_ID INT, -- fk user_login     
    team_name VARCHAR(100),
    is_paid BOOLEAN DEFAULT FALSE,
    CHECK (player_1_ID <> player_2_ID)

);

ALTER TABLE physical_tournament_team
    ADD CONSTRAINT physical_tournament_team_physical_tournament_FK FOREIGN KEY (tournament_ID) REFERENCES physical_tournament (tournament_ID) ON DELETE CASCADE,
    ADD CONSTRAINT physical_tournament_team_user_login_1_FK FOREIGN KEY (player_1_ID) REFERENCES user_login (user_ID) ON DELETE CASCADE,
    ADD CONSTRAINT physical_tournament_team_user_login_2_FK FOREIGN KEY (player_2_ID) REFERENCES user_login (user_ID)ON DELETE CASCADE;





CREATE TABLE IF NOT EXISTS local_meetup_ad (
    ad_ID INT AUTO_INCREMENT PRIMARY KEY,
    creator_ID  INT, -- fk user_login
    location VARCHAR(255),
    missing_players INT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE local_meetup_ad
    ADD CONSTRAINT local_meetup_ad_user_login_FK FOREIGN KEY (creator_ID) REFERENCES user_login (user_ID);

CREATE TABLE IF NOT EXISTS meetup_request (
    request_ID INT AUTO_INCREMENT PRIMARY KEY,
    ad_ID INT, --fk de local_meetup_ad
    applicant_ID INT, -- fk user_login
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending'
);

ALTER TABLE meetup_request
    ADD CONSTRAINT meetup_request_local_meetup_ad_FK FOREIGN KEY  (ad_ID) REFERENCES local_meetup_ad (ad_ID) ON DELETE CASCADE,
    ADD CONSTRAINT meetup_request_user_login_FK FOREIGN KEY (applicant_ID) REFERENCES user_login (user_ID) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS game_action_log (
    log_ID INT AUTO_INCREMENT PRIMARY KEY,
    game_ID INT, --fk de play_game
    user_ID INT, --fk de user_login
    action TEXT NOT NULL,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE game_action_log
    ADD CONSTRAINT game_action_log_play_game_FK FOREIGN KEY (game_ID) REFERENCES play_game(game_ID) ON DELETE CASCADE,
    ADD CONSTRAINT game_action_log_user_login_FK FOREIGN KEY (user_ID) REFERENCES user_login (user_ID) ON DELETE CASCADE;


CREATE TABLE IF NOT EXISTS friendships (
    friendship_ID INT AUTO_INCREMENT PRIMARY KEY,
    user_ID_1 INT, --fk de user_login
    user_ID_2 INT , --fk de user_login 
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    CHECK (user_ID_1 <> user_ID_2)

);

ALTER TABLE friendships
    ADD CONSTRAINT friendships_user_login_1_FK FOREIGN KEY (user_ID_1) REFERENCES user_login (user_ID) ON DELETE CASCADE,
    ADD CONSTRAINT friendships_user_login_2_FK FOREIGN KEY (user_ID_2) REFERENCES user_login (user_ID) ON DELETE CASCADE;

INSERT INTO user_login (name, email) VALUES 
('Juan Pérez', 'juan@example.com'),
('María García', 'maria@example.com'),
('Carlos López', 'carlos@example.com');