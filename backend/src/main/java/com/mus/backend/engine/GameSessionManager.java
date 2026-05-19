package com.mus.backend.engine;

import com.mus.backend.model.GameActionLog;
import com.mus.backend.model.PlayGame;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.repository.GameActionLogRepository;
import com.mus.backend.repository.PlayGameRepository;
import com.mus.backend.repository.UserGameProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameSessionManager {

    private final Map<String, GameSession> sessions = new ConcurrentHashMap<>();
    
    // Cola de Matchmaking Online
    private final List<MatchmakerEntry> matchmakingQueue = new ArrayList<>();

    @Autowired
    private PlayGameRepository playGameRepository;

    @Autowired
    private UserGameProfileRepository profileRepository;

    @Autowired
    private GameActionLogRepository actionLogRepository;

    public static class MatchmakerEntry {
        public Long userId;
        public String username;
        public String socketId; // will be resolved in socket mapping

        public MatchmakerEntry(Long userId, String username) {
            this.userId = userId;
            this.username = username;
        }
    }

    public GameSession createRoom(String roomId) {
        roomId = roomId.toUpperCase().trim();
        if (sessions.containsKey(roomId)) {
            return sessions.get(roomId);
        }
        GameSession session = new GameSession(roomId);
        sessions.put(roomId, session);
        return session;
    }

    public GameSession getRoom(String roomId) {
        return sessions.get(roomId.toUpperCase().trim());
    }

    public void removeRoom(String roomId) {
        sessions.remove(roomId.toUpperCase().trim());
    }

    public Collection<GameSession> getAllSessions() {
        return sessions.values();
    }

    // --- COLA DE MATCHMAKING LOBBY ---

    public synchronized String addToMatchmaking(Long userId, String username) {
        // Evitamos duplicados en la cola
        matchmakingQueue.removeIf(entry -> entry.userId.equals(userId));
        matchmakingQueue.add(new MatchmakerEntry(userId, username));
        
        if (matchmakingQueue.size() >= 4) {
            // Creamos sala automática de Matchmaking
            String autoRoomId = "PARTIDA-" + Math.floor(100 + Math.random() * 900);
            GameSession session = createRoom(autoRoomId);
            
            // Sentamos a los 4 jugadores
            for (int chair = 0; chair < 4; chair++) {
                MatchmakerEntry player = matchmakingQueue.remove(0);
                session.addPlayer(chair, player.userId, player.username);
            }
            
            // Persistimos la partida iniciada en la Base de Datos
            saveNewGameToDb(session);
            
            session.startMatch();
            return autoRoomId;
        }
        return null;
    }

    public synchronized void removeFromMatchmaking(Long userId) {
        matchmakingQueue.removeIf(entry -> entry.userId.equals(userId));
    }

    public synchronized int getMatchmakingQueueSize() {
        return matchmakingQueue.size();
    }

    // --- BASE DE DATOS PERSISTENCE SYNC ---

    public void saveNewGameToDb(GameSession session) {
        try {
            PlayGame pg = new PlayGame();
            pg.setPlayer1(session.getPlayers().get(0) != null ? session.getPlayers().get(0).getUserId() : null);
            pg.setPlayer2(session.getPlayers().get(1) != null ? session.getPlayers().get(1).getUserId() : null);
            pg.setPlayer3(session.getPlayers().get(2) != null ? session.getPlayers().get(2).getUserId() : null);
            pg.setPlayer4(session.getPlayers().get(3) != null ? session.getPlayers().get(3).getUserId() : null);
            pg.setPointsTeam12(0);
            pg.setPointsTeam34(0);
            pg.setGameStateId(1); // 1 = En Progreso
            pg.setGameModeId(1); // 1 = 4 Jugadores Normal
            pg.setCreatedAt(LocalDateTime.now());
            
            PlayGame saved = playGameRepository.save(pg);
            session.setGameDatabaseId(saved.getGameId());
            session.appendLog("[BD] Partida registrada ID: " + saved.getGameId());
        } catch (Exception e) {
            System.err.println("Error saving new game match to DB: " + e.getMessage());
            session.appendLog("⚠️ [BD] Error al guardar el registro en MySQL.");
        }
    }

    public void logActionToDb(GameSession session, int playerIdx, String action) {
        if (session.getGameDatabaseId() == null) return;
        try {
            GameSession.GamePlayer p = session.getPlayers().get(playerIdx);
            Long uId = p != null ? p.getUserId() : null; // null represents Bot
            
            GameActionLog log = new GameActionLog(session.getGameDatabaseId(), uId, action);
            actionLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Error saving action log to DB: " + e.getMessage());
        }
    }

    public void updateGameScoresInDb(GameSession session) {
        if (session.getGameDatabaseId() == null) return;
        try {
            playGameRepository.findById(session.getGameDatabaseId()).ifPresent(pg -> {
                pg.setPointsTeam12(session.getScoreUs());
                pg.setPointsTeam34(session.getScoreThem());
                
                boolean isOver = session.getScoreUs() >= 30 || session.getScoreThem() >= 30;
                if (isOver) {
                    pg.setGameStateId(2); // 2 = Finalizada
                    // Actualizar las estadísticas de los perfiles de los jugadores reales
                    syncUserStatsPostGame(session);
                }
                playGameRepository.save(pg);
            });
        } catch (Exception e) {
            System.err.println("Error updating game scores in DB: " + e.getMessage());
        }
    }

    private void syncUserStatsPostGame(GameSession session) {
        boolean usWon = session.getScoreUs() >= 30;
        
        for (int chair = 0; chair < 4; chair++) {
            GameSession.GamePlayer gp = session.getPlayers().get(chair);
            if (gp != null && !gp.isBot() && gp.getUserId() != null) {
                Long uId = gp.getUserId();
                boolean isUsTeam = (chair % 2 == 0);
                boolean didWin = (isUsTeam == usWon);
                
                try {
                    UserGameProfile profile = profileRepository.findById(uId)
                            .orElseGet(() -> new UserGameProfile(uId));
                    
                    profile.setTotalGamesPlayed(profile.getTotalGamesPlayed() + 1);
                    if (didWin) {
                        profile.setTotalGamesWon(profile.getTotalGamesWon() + 1);
                        profile.setElo(profile.getElo() + 15); // +15 ELO por victoria
                        profile.setCoins(profile.getCoins() + 25); // +25 monedas por victoria
                    } else {
                        profile.setElo(Math.max(0, profile.getElo() - 8)); // -8 ELO por derrota (mínimo 0)
                        profile.setCoins(profile.getCoins() + 5); // +5 monedas de cortesía por jugar
                    }
                    profileRepository.save(profile);
                    session.appendLog(String.format("[BD] Perfil de %s actualizado (ELO: %d)", gp.getUsername(), profile.getElo()));
                } catch (Exception e) {
                    System.err.println("Error updating user statistics in DB: " + e.getMessage());
                }
            }
        }
    }
}
