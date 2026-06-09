-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: mudb
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '6fa60ebe-634a-11f1-8962-7240590e2b31:1-68';

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'profiles','Profilak / Perfiles'),(2,'decks','Kartak / Cartas'),(3,'aliases','Ezizenak / Alias');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat`
--

DROP TABLE IF EXISTS `chat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat` (
  `message_id` bigint NOT NULL AUTO_INCREMENT,
  `game_id` bigint DEFAULT NULL,
  `content` text,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`message_id`),
  KEY `chat_play_game_FK` (`game_id`),
  KEY `chat_users_FK` (`user_id`),
  CONSTRAINT `chat_play_game_FK` FOREIGN KEY (`game_id`) REFERENCES `play_game` (`game_id`) ON DELETE CASCADE,
  CONSTRAINT `chat_users_FK` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat`
--

LOCK TABLES `chat` WRITE;
/*!40000 ALTER TABLE `chat` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `direct_messages`
--

DROP TABLE IF EXISTS `direct_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `direct_messages` (
  `message_id` bigint NOT NULL AUTO_INCREMENT,
  `sender_id` bigint NOT NULL,
  `receiver_id` bigint NOT NULL,
  `content` text NOT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `direct_messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `direct_messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `direct_messages`
--

LOCK TABLES `direct_messages` WRITE;
/*!40000 ALTER TABLE `direct_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `direct_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friendships`
--

DROP TABLE IF EXISTS `friendships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friendships` (
  `friendship_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id_1` bigint DEFAULT NULL,
  `user_id_2` bigint DEFAULT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  PRIMARY KEY (`friendship_id`),
  KEY `friendships_users_1_FK` (`user_id_1`),
  KEY `friendships_users_2_FK` (`user_id_2`),
  CONSTRAINT `friendships_users_1_FK` FOREIGN KEY (`user_id_1`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `friendships_users_2_FK` FOREIGN KEY (`user_id_2`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `friendships_chk_1` CHECK ((`user_id_1` <> `user_id_2`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friendships`
--

LOCK TABLES `friendships` WRITE;
/*!40000 ALTER TABLE `friendships` DISABLE KEYS */;
/*!40000 ALTER TABLE `friendships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_action_log`
--

DROP TABLE IF EXISTS `game_action_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_action_log` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `game_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `action` text NOT NULL,
  `action_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `game_action_log_play_game_FK` (`game_id`),
  KEY `game_action_log_users_FK` (`user_id`),
  CONSTRAINT `game_action_log_play_game_FK` FOREIGN KEY (`game_id`) REFERENCES `play_game` (`game_id`) ON DELETE CASCADE,
  CONSTRAINT `game_action_log_users_FK` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_action_log`
--

LOCK TABLES `game_action_log` WRITE;
/*!40000 ALTER TABLE `game_action_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `game_action_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_matches`
--

DROP TABLE IF EXISTS `game_matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_matches` (
  `game_matches_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `score_us` int DEFAULT '0',
  `score_them` int DEFAULT '0',
  `status` varchar(20) DEFAULT 'IN_PROGRESS',
  PRIMARY KEY (`game_matches_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `game_matches_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_matches`
--

LOCK TABLES `game_matches` WRITE;
/*!40000 ALTER TABLE `game_matches` DISABLE KEYS */;
/*!40000 ALTER TABLE `game_matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_mode`
--

DROP TABLE IF EXISTS `game_mode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_mode` (
  `game_mode_id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`game_mode_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_mode`
--

LOCK TABLES `game_mode` WRITE;
/*!40000 ALTER TABLE `game_mode` DISABLE KEYS */;
INSERT INTO `game_mode` VALUES (1,'Normal 4 Jugadores','Partida de Mus standard con 4 jugadores o bots');
/*!40000 ALTER TABLE `game_mode` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_states`
--

DROP TABLE IF EXISTS `game_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_states` (
  `game_state_id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`game_state_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_states`
--

LOCK TABLES `game_states` WRITE;
/*!40000 ALTER TABLE `game_states` DISABLE KEYS */;
INSERT INTO `game_states` VALUES (1,'En Progreso','Partida en juego actualmente'),(2,'Finalizada','Partida terminada por llegar a 30 puntos'),(3,'Abandonada','Partida cancelada por abandono');
/*!40000 ALTER TABLE `game_states` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `item_id` bigint NOT NULL AUTO_INCREMENT,
  `category_id` bigint DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `price` int unsigned NOT NULL,
  PRIMARY KEY (`item_id`),
  KEY `items_categories_FK` (`category_id`),
  CONSTRAINT `items_categories_FK` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (1,1,'Perfil Txapeldun',850),(2,1,'Perfil Fronton',620),(3,2,'Baraja Euskal',1200),(4,2,'Baraja Gau Beltza',1450),(5,3,'Handia',350),(6,3,'Enbido Maisu',700),(7,1,'Perfil IkurriÃ±a',900),(8,1,'Perfil Karta',500),(9,2,'Baraja Klasikoa',600),(10,2,'Baraja Berezia',1500),(11,3,'Txapeldun',800),(12,3,'Musolari',400),(13,3,'Zazpi eta Erdi',300);
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `local_auth`
--

DROP TABLE IF EXISTS `local_auth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `local_auth` (
  `auth_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `password` varchar(255) NOT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT '0',
  `two_factor_code` varchar(6) DEFAULT NULL,
  `two_factor_code_expires_at` datetime DEFAULT NULL,
  `reset_password_token` varchar(255) DEFAULT NULL,
  `reset_password_token_expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`auth_id`),
  UNIQUE KEY `unique_local_auth_user` (`user_id`),
  CONSTRAINT `local_auth_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `local_auth`
--

LOCK TABLES `local_auth` WRITE;
/*!40000 ALTER TABLE `local_auth` DISABLE KEYS */;
INSERT INTO `local_auth` VALUES (1,100,'$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK',0,NULL,NULL,NULL,NULL),(2,101,'$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK',0,NULL,NULL,NULL,NULL),(3,102,'$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK',0,NULL,NULL,NULL,NULL),(4,103,'$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK',0,NULL,NULL,NULL,NULL),(5,104,'$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK',0,NULL,NULL,NULL,NULL),(6,105,'$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK',0,NULL,NULL,NULL,NULL),(7,106,'$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK',0,NULL,NULL,NULL,NULL),(8,107,'$2b$10$4WLoSlqBiTzVKAKCuIIxGeyExhpZwqQRay8NoHRfttWWYzT.IR5zK',0,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `local_auth` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `local_meetup_ad`
--

DROP TABLE IF EXISTS `local_meetup_ad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `local_meetup_ad` (
  `ad_id` bigint NOT NULL AUTO_INCREMENT,
  `creator_id` bigint DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `missing_players` int DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `establishment_type` varchar(50) DEFAULT 'BAR',
  PRIMARY KEY (`ad_id`),
  KEY `local_meetup_ad_users_FK` (`creator_id`),
  KEY `idx_local_meetup_ad_active` (`is_active`),
  CONSTRAINT `local_meetup_ad_users_FK` FOREIGN KEY (`creator_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `local_meetup_ad`
--

LOCK TABLES `local_meetup_ad` WRITE;
/*!40000 ALTER TABLE `local_meetup_ad` DISABLE KEYS */;
/*!40000 ALTER TABLE `local_meetup_ad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matchmaking_queue`
--

DROP TABLE IF EXISTS `matchmaking_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matchmaking_queue` (
  `queue_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `looking_for` enum('partner','opponent') DEFAULT 'partner',
  `game_mode_id` bigint DEFAULT NULL,
  `status` enum('searching','cancelled','matched') DEFAULT 'searching',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`queue_id`),
  KEY `matchmaking_queue_users_FK` (`user_id`),
  KEY `matchmaking_queue_game_mode_FK` (`game_mode_id`),
  CONSTRAINT `matchmaking_queue_game_mode_FK` FOREIGN KEY (`game_mode_id`) REFERENCES `game_mode` (`game_mode_id`),
  CONSTRAINT `matchmaking_queue_users_FK` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matchmaking_queue`
--

LOCK TABLES `matchmaking_queue` WRITE;
/*!40000 ALTER TABLE `matchmaking_queue` DISABLE KEYS */;
/*!40000 ALTER TABLE `matchmaking_queue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meetup_messages`
--

DROP TABLE IF EXISTS `meetup_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meetup_messages` (
  `message_id` bigint NOT NULL AUTO_INCREMENT,
  `ad_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `content` text,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `ad_id` (`ad_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `meetup_messages_ibfk_1` FOREIGN KEY (`ad_id`) REFERENCES `local_meetup_ad` (`ad_id`) ON DELETE CASCADE,
  CONSTRAINT `meetup_messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetup_messages`
--

LOCK TABLES `meetup_messages` WRITE;
/*!40000 ALTER TABLE `meetup_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `meetup_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meetup_participants`
--

DROP TABLE IF EXISTS `meetup_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meetup_participants` (
  `meetup_participants_id` bigint NOT NULL AUTO_INCREMENT,
  `ad_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`meetup_participants_id`),
  KEY `ad_id` (`ad_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `meetup_participants_ibfk_1` FOREIGN KEY (`ad_id`) REFERENCES `local_meetup_ad` (`ad_id`) ON DELETE CASCADE,
  CONSTRAINT `meetup_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetup_participants`
--

LOCK TABLES `meetup_participants` WRITE;
/*!40000 ALTER TABLE `meetup_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `meetup_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meetup_request`
--

DROP TABLE IF EXISTS `meetup_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meetup_request` (
  `request_id` bigint NOT NULL AUTO_INCREMENT,
  `ad_id` bigint DEFAULT NULL,
  `applicant_id` bigint DEFAULT NULL,
  `message` text,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  PRIMARY KEY (`request_id`),
  KEY `meetup_request_local_meetup_ad_FK` (`ad_id`),
  KEY `meetup_request_users_FK` (`applicant_id`),
  CONSTRAINT `meetup_request_local_meetup_ad_FK` FOREIGN KEY (`ad_id`) REFERENCES `local_meetup_ad` (`ad_id`) ON DELETE CASCADE,
  CONSTRAINT `meetup_request_users_FK` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetup_request`
--

LOCK TABLES `meetup_request` WRITE;
/*!40000 ALTER TABLE `meetup_request` DISABLE KEYS */;
/*!40000 ALTER TABLE `meetup_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oauth_auth`
--

DROP TABLE IF EXISTS `oauth_auth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_auth` (
  `auth_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `provider` varchar(20) NOT NULL,
  `provider_user_id` varchar(100) NOT NULL,
  `provider_email` varchar(150) NOT NULL,
  `access_token` varchar(500) DEFAULT NULL,
  `refresh_token` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`auth_id`),
  UNIQUE KEY `unique_provider_user` (`provider`,`provider_user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `oauth_auth_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oauth_auth`
--

LOCK TABLES `oauth_auth` WRITE;
/*!40000 ALTER TABLE `oauth_auth` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_auth` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `physical_tournament`
--

DROP TABLE IF EXISTS `physical_tournament`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `physical_tournament` (
  `tournament_id` bigint NOT NULL AUTO_INCREMENT,
  `organizer_id` bigint DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `specific_location` varchar(255) DEFAULT NULL,
  `start_datetime` datetime DEFAULT NULL,
  `entry_fee` decimal(10,2) DEFAULT '0.00',
  `max_teams` int DEFAULT NULL,
  `status` enum('open','playing','finished','cancelled') DEFAULT 'open',
  `coins_fee` int DEFAULT '0',
  `coins_reward` int DEFAULT '0',
  PRIMARY KEY (`tournament_id`),
  KEY `physical_tournament_users_FK` (`organizer_id`),
  CONSTRAINT `physical_tournament_users_FK` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `physical_tournament`
--

LOCK TABLES `physical_tournament` WRITE;
/*!40000 ALTER TABLE `physical_tournament` DISABLE KEYS */;
INSERT INTO `physical_tournament` VALUES (100,100,'Gran Copa Euskal Herria','Donostia','Gros Kiroldegia','2026-06-15 18:00:00',0.00,8,'open',50,400),(101,101,'Kopa Bilbo Mus','Bilbo','Kasko Zaharra Cafe','2026-05-30 19:30:00',0.00,8,'playing',100,800),(102,100,'Txapelketa Gasteiz','Gasteiz','Zabalgana Kultur Etxea','2026-05-20 17:00:00',0.00,8,'finished',75,600),(103,102,'Torneo RÃ¡pido Eibar','Eibar','Unzaga Plaza Taberna','2026-06-10 20:00:00',0.00,8,'open',40,300);
/*!40000 ALTER TABLE `physical_tournament` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `physical_tournament_match`
--

DROP TABLE IF EXISTS `physical_tournament_match`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `physical_tournament_match` (
  `match_id` bigint NOT NULL AUTO_INCREMENT,
  `tournament_id` bigint DEFAULT NULL,
  `round_number` int DEFAULT NULL,
  `match_index` int DEFAULT NULL,
  `player1_id` bigint DEFAULT NULL,
  `player2_id` bigint DEFAULT NULL,
  `winner_id` bigint DEFAULT NULL,
  `score` varchar(20) DEFAULT '',
  PRIMARY KEY (`match_id`),
  KEY `tournament_id` (`tournament_id`),
  KEY `player1_id` (`player1_id`),
  KEY `player2_id` (`player2_id`),
  KEY `winner_id` (`winner_id`),
  CONSTRAINT `physical_tournament_match_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `physical_tournament` (`tournament_id`) ON DELETE CASCADE,
  CONSTRAINT `physical_tournament_match_ibfk_2` FOREIGN KEY (`player1_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `physical_tournament_match_ibfk_3` FOREIGN KEY (`player2_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `physical_tournament_match_ibfk_4` FOREIGN KEY (`winner_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `physical_tournament_match`
--

LOCK TABLES `physical_tournament_match` WRITE;
/*!40000 ALTER TABLE `physical_tournament_match` DISABLE KEYS */;
INSERT INTO `physical_tournament_match` VALUES (1,101,1,0,100,101,100,'3-1'),(2,101,1,1,102,103,103,'3-2'),(3,101,1,2,104,105,104,'3-0'),(4,101,1,3,106,107,NULL,''),(5,101,2,0,100,103,NULL,''),(6,101,2,1,104,NULL,NULL,''),(7,101,3,0,NULL,NULL,NULL,''),(8,102,1,0,100,101,101,'3-2'),(9,102,1,1,102,103,102,'3-1'),(10,102,1,2,104,105,105,'3-0'),(11,102,1,3,106,107,106,'3-1'),(12,102,2,0,101,102,101,'3-0'),(13,102,2,1,105,106,105,'3-2'),(14,102,3,0,101,105,101,'3-1');
/*!40000 ALTER TABLE `physical_tournament_match` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `physical_tournament_participant`
--

DROP TABLE IF EXISTS `physical_tournament_participant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `physical_tournament_participant` (
  `tournament_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tournament_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `physical_tournament_participant_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `physical_tournament` (`tournament_id`) ON DELETE CASCADE,
  CONSTRAINT `physical_tournament_participant_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `physical_tournament_participant`
--

LOCK TABLES `physical_tournament_participant` WRITE;
/*!40000 ALTER TABLE `physical_tournament_participant` DISABLE KEYS */;
INSERT INTO `physical_tournament_participant` VALUES (100,100,'2026-06-08 14:58:04'),(100,101,'2026-06-08 14:58:04'),(100,102,'2026-06-08 14:58:04'),(100,103,'2026-06-08 14:58:04'),(101,100,'2026-06-08 14:58:04'),(101,101,'2026-06-08 14:58:04'),(101,102,'2026-06-08 14:58:04'),(101,103,'2026-06-08 14:58:04'),(101,104,'2026-06-08 14:58:04'),(101,105,'2026-06-08 14:58:04'),(101,106,'2026-06-08 14:58:04'),(101,107,'2026-06-08 14:58:04'),(102,100,'2026-06-08 14:58:04'),(102,101,'2026-06-08 14:58:04'),(102,102,'2026-06-08 14:58:04'),(102,103,'2026-06-08 14:58:04'),(102,104,'2026-06-08 14:58:04'),(102,105,'2026-06-08 14:58:04'),(102,106,'2026-06-08 14:58:04'),(102,107,'2026-06-08 14:58:04'),(103,100,'2026-06-08 14:58:04'),(103,101,'2026-06-08 14:58:04'),(103,102,'2026-06-08 14:58:04'),(103,103,'2026-06-08 14:58:04'),(103,104,'2026-06-08 14:58:04'),(103,105,'2026-06-08 14:58:04'),(103,106,'2026-06-08 14:58:04');
/*!40000 ALTER TABLE `physical_tournament_participant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `physical_tournament_team`
--

DROP TABLE IF EXISTS `physical_tournament_team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `physical_tournament_team` (
  `team_id` bigint NOT NULL AUTO_INCREMENT,
  `tournament_id` bigint DEFAULT NULL,
  `player_1_id` bigint DEFAULT NULL,
  `player_2_id` bigint DEFAULT NULL,
  `team_name` varchar(100) DEFAULT NULL,
  `is_paid` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`team_id`),
  KEY `physical_tournament_team_physical_tournament_FK` (`tournament_id`),
  KEY `physical_tournament_team_users_1_FK` (`player_1_id`),
  KEY `physical_tournament_team_users_2_FK` (`player_2_id`),
  CONSTRAINT `physical_tournament_team_physical_tournament_FK` FOREIGN KEY (`tournament_id`) REFERENCES `physical_tournament` (`tournament_id`) ON DELETE CASCADE,
  CONSTRAINT `physical_tournament_team_users_1_FK` FOREIGN KEY (`player_1_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `physical_tournament_team_users_2_FK` FOREIGN KEY (`player_2_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `physical_tournament_team_chk_1` CHECK ((`player_1_id` <> `player_2_id`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `physical_tournament_team`
--

LOCK TABLES `physical_tournament_team` WRITE;
/*!40000 ALTER TABLE `physical_tournament_team` DISABLE KEYS */;
/*!40000 ALTER TABLE `physical_tournament_team` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `play_game`
--

DROP TABLE IF EXISTS `play_game`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `play_game` (
  `game_id` bigint NOT NULL AUTO_INCREMENT,
  `player1` bigint DEFAULT NULL,
  `player2` bigint DEFAULT NULL,
  `player3` bigint DEFAULT NULL,
  `player4` bigint DEFAULT NULL,
  `game_state_id` bigint DEFAULT NULL,
  `game_mode_id` bigint DEFAULT NULL,
  `points_team_12` int DEFAULT '0',
  `points_team_34` int DEFAULT '0',
  `total_time_seconds` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `tournament_id` bigint DEFAULT NULL,
  PRIMARY KEY (`game_id`),
  KEY `play_game1_users_FK` (`player1`),
  KEY `play_game2_users_FK` (`player2`),
  KEY `play_game3_users_FK` (`player3`),
  KEY `play_game4_users_FK` (`player4`),
  KEY `play_game_game_states_FK` (`game_state_id`),
  KEY `play_game_game_mode_FK` (`game_mode_id`),
  KEY `play_game_tournaments_FK` (`tournament_id`),
  CONSTRAINT `play_game1_users_FK` FOREIGN KEY (`player1`) REFERENCES `users` (`user_id`),
  CONSTRAINT `play_game2_users_FK` FOREIGN KEY (`player2`) REFERENCES `users` (`user_id`),
  CONSTRAINT `play_game3_users_FK` FOREIGN KEY (`player3`) REFERENCES `users` (`user_id`),
  CONSTRAINT `play_game4_users_FK` FOREIGN KEY (`player4`) REFERENCES `users` (`user_id`),
  CONSTRAINT `play_game_game_mode_FK` FOREIGN KEY (`game_mode_id`) REFERENCES `game_mode` (`game_mode_id`),
  CONSTRAINT `play_game_game_states_FK` FOREIGN KEY (`game_state_id`) REFERENCES `game_states` (`game_state_id`),
  CONSTRAINT `play_game_tournaments_FK` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`tournament_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `play_game`
--

LOCK TABLES `play_game` WRITE;
/*!40000 ALTER TABLE `play_game` DISABLE KEYS */;
/*!40000 ALTER TABLE `play_game` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_history`
--

DROP TABLE IF EXISTS `purchase_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_history` (
  `purchase_history_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `item_id` bigint DEFAULT NULL,
  `coins_spent` int unsigned NOT NULL,
  `purchased_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`purchase_history_id`),
  KEY `purchase_history_users_FK` (`user_id`),
  KEY `purchase_history_items_FK` (`item_id`),
  CONSTRAINT `purchase_history_items_FK` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_history_users_FK` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_history`
--

LOCK TABLES `purchase_history` WRITE;
/*!40000 ALTER TABLE `purchase_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tournament_participant`
--

DROP TABLE IF EXISTS `tournament_participant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tournament_participant` (
  `tournament_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tournament_id`,`user_id`),
  KEY `tournament_participant_users_FK` (`user_id`),
  CONSTRAINT `tournament_participant_tournaments_FK` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`tournament_id`) ON DELETE CASCADE,
  CONSTRAINT `tournament_participant_users_FK` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tournament_participant`
--

LOCK TABLES `tournament_participant` WRITE;
/*!40000 ALTER TABLE `tournament_participant` DISABLE KEYS */;
/*!40000 ALTER TABLE `tournament_participant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tournaments`
--

DROP TABLE IF EXISTS `tournaments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tournaments` (
  `tournament_id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`tournament_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tournaments`
--

LOCK TABLES `tournaments` WRITE;
/*!40000 ALTER TABLE `tournaments` DISABLE KEYS */;
/*!40000 ALTER TABLE `tournaments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_game_profile`
--

DROP TABLE IF EXISTS `user_game_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_game_profile` (
  `user_id` bigint NOT NULL,
  `elo` int DEFAULT '200',
  `coins` int unsigned DEFAULT '0',
  `total_games_played` int DEFAULT '0',
  `total_games_won` int DEFAULT '0',
  `equipped_avatar_item_id` bigint DEFAULT NULL,
  `equipped_deck_item_id` bigint DEFAULT NULL,
  `equipped_title_item_id` bigint DEFAULT NULL,
  `equipped_board_item_id` bigint DEFAULT NULL,
  `music_enabled` tinyint(1) DEFAULT '1',
  `music_volume` double DEFAULT '0.5',
  `sound_enabled` tinyint(1) DEFAULT '1',
  `sound_volume` double DEFAULT '0.5',
  `view_mode` varchar(10) DEFAULT '2d',
  `language` varchar(5) DEFAULT 'es',
  `notifications_enabled` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`user_id`),
  KEY `user_game_profile_avatar_item_FK` (`equipped_avatar_item_id`),
  KEY `user_game_profile_deck_item_FK` (`equipped_deck_item_id`),
  KEY `user_game_profile_title_item_FK` (`equipped_title_item_id`),
  KEY `idx_user_game_profile_elo` (`elo` DESC),
  CONSTRAINT `user_game_profile_avatar_item_FK` FOREIGN KEY (`equipped_avatar_item_id`) REFERENCES `items` (`item_id`) ON DELETE SET NULL,
  CONSTRAINT `user_game_profile_deck_item_FK` FOREIGN KEY (`equipped_deck_item_id`) REFERENCES `items` (`item_id`) ON DELETE SET NULL,
  CONSTRAINT `user_game_profile_title_item_FK` FOREIGN KEY (`equipped_title_item_id`) REFERENCES `items` (`item_id`) ON DELETE SET NULL,
  CONSTRAINT `user_game_profile_users_FK` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_game_profile`
--

LOCK TABLES `user_game_profile` WRITE;
/*!40000 ALTER TABLE `user_game_profile` DISABLE KEYS */;
INSERT INTO `user_game_profile` VALUES (100,240,1000,20,12,NULL,NULL,NULL,NULL,1,0.5,1,0.5,'2d','es',1),(101,280,1200,25,18,NULL,NULL,NULL,NULL,1,0.5,1,0.5,'2d','es',1),(102,220,800,15,7,NULL,NULL,NULL,NULL,1,0.5,1,0.5,'2d','es',1),(103,250,1500,30,19,NULL,NULL,NULL,NULL,1,0.5,1,0.5,'2d','es',1),(104,210,500,10,4,NULL,NULL,NULL,NULL,1,0.5,1,0.5,'2d','es',1),(105,190,300,8,3,NULL,NULL,NULL,NULL,1,0.5,1,0.5,'2d','es',1),(106,260,900,18,11,NULL,NULL,NULL,NULL,1,0.5,1,0.5,'2d','es',1),(107,235,750,22,12,NULL,NULL,NULL,NULL,1,0.5,1,0.5,'2d','es',1);
/*!40000 ALTER TABLE `user_game_profile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_inventory`
--

DROP TABLE IF EXISTS `user_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_inventory` (
  `user_id` bigint NOT NULL,
  `item_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`item_id`),
  KEY `user_inventory_items_FK` (`item_id`),
  CONSTRAINT `user_inventory_items_FK` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `user_inventory_users_FK` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_inventory`
--

LOCK TABLES `user_inventory` WRITE;
/*!40000 ALTER TABLE `user_inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `surname` varchar(100) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `is_banned` tinyint(1) DEFAULT '0',
  `birth_date` date DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (100,'Mikel',NULL,'mikel@email.com',NULL,NULL,'mikel','user',0,NULL,NULL,'2026-06-08 14:58:04','2026-06-08 14:58:04'),(101,'Ane',NULL,'ane@email.com',NULL,NULL,'ane','user',0,NULL,NULL,'2026-06-08 14:58:04','2026-06-08 14:58:04'),(102,'Jon',NULL,'jon@email.com',NULL,NULL,'jon','user',0,NULL,NULL,'2026-06-08 14:58:04','2026-06-08 14:58:04'),(103,'Gorka',NULL,'gorka@email.com',NULL,NULL,'gorka','user',0,NULL,NULL,'2026-06-08 14:58:04','2026-06-08 14:58:04'),(104,'Amaia',NULL,'amaia@email.com',NULL,NULL,'amaia','user',0,NULL,NULL,'2026-06-08 14:58:04','2026-06-08 14:58:04'),(105,'Ander',NULL,'ander@email.com',NULL,NULL,'ander','user',0,NULL,NULL,'2026-06-08 14:58:04','2026-06-08 14:58:04'),(106,'Irati',NULL,'irati@email.com',NULL,NULL,'irati','user',0,NULL,NULL,'2026-06-08 14:58:04','2026-06-08 14:58:04'),(107,'Koldo',NULL,'koldo@email.com',NULL,NULL,'koldo','user',0,NULL,NULL,'2026-06-08 14:58:04','2026-06-08 14:58:04');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_users_insert` AFTER INSERT ON `users` FOR EACH ROW BEGIN
    -- Inicializar perfil de juego de forma automática para el nuevo usuario
    INSERT IGNORE INTO user_game_profile (user_id, elo, coins, total_games_played, total_games_won) 
    VALUES (NEW.user_id, 200, 100, 0, 0);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Dumping routines for database 'mudb'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_buy_item` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_buy_item`(
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-09 20:29:40
