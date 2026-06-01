package com.mus.backend.engine;

import com.mus.backend.model.GameActionLog;
import com.mus.backend.model.PlayGame;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.repository.GameActionLogRepository;
import com.mus.backend.repository.PlayGameRepository;
import com.mus.backend.repository.UserGameProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameSessionManager {

    private final Map<String, GameSession> sessions = new ConcurrentHashMap<>();
    
    // Cola de Matchmaking Online segmentada
    private final List<MatchmakerEntry> matchmakingQueue4 = new ArrayList<>();
    private final List<MatchmakerEntry> matchmakingQueue8 = new ArrayList<>();

    @Autowired
    private PlayGameRepository playGameRepository;

    @Autowired
    private UserGameProfileRepository profileRepository;

    @Autowired
    private GameActionLogRepository actionLogRepository;

    public static class MatchmakerEntry {
        public Long userId;
        public String username;
        public double elo;
        public double ratingDeviation;
        public long entryTime;
        public String reyesOption;

        public MatchmakerEntry(Long userId, String username, double elo, double ratingDeviation, String reyesOption) {
            this.userId = userId;
            this.username = username;
            this.elo = elo;
            this.ratingDeviation = ratingDeviation;
            this.entryTime = System.currentTimeMillis();
            this.reyesOption = reyesOption;
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
        return addToMatchmaking(userId, username, "8");
    }

    public synchronized String addToMatchmaking(Long userId, String username, String reyesOption) {
        if (reyesOption == null || (!reyesOption.equals("4") && !reyesOption.equals("8"))) {
            reyesOption = "8";
        }
        
        List<MatchmakerEntry> targetQueue = "4".equals(reyesOption) ? matchmakingQueue4 : matchmakingQueue8;
        
        // Evitamos duplicados en ambas colas
        matchmakingQueue4.removeIf(entry -> entry.userId.equals(userId));
        matchmakingQueue8.removeIf(entry -> entry.userId.equals(userId));
        
        // Cargar estadísticas Glicko-2 del jugador
        UserGameProfile profile = profileRepository.findById(userId)
                .orElseGet(() -> new UserGameProfile(userId));
        
        // Validar penalización de ban de emparejamiento
        if (profile.getMatchmakingBanUntil() != null && profile.getMatchmakingBanUntil().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Estás temporalmente baneado de buscar partidas.");
        }
        
        double userElo = profile.getElo().doubleValue();
        double userRd = profile.getRatingDeviation();
        
        targetQueue.add(new MatchmakerEntry(userId, username, userElo, userRd, reyesOption));
        return null; // El Scheduler asíncrono se encargará del matching
    }

    public synchronized List<Map<String, Object>> runMatchmakingStep() {
        List<Map<String, Object>> matchedRooms = new ArrayList<>();
        matchedRooms.addAll(matchQueue("8", matchmakingQueue8));
        matchedRooms.addAll(matchQueue("4", matchmakingQueue4));
        return matchedRooms;
    }
    
    private List<Map<String, Object>> matchQueue(String reyesOption, List<MatchmakerEntry> queue) {
        List<Map<String, Object>> matched = new ArrayList<>();
        long now = System.currentTimeMillis();
        
        boolean foundGroup = true;
        while (foundGroup && queue.size() >= 4) {
            foundGroup = false;
            
            for (int i = 0; i < queue.size(); i++) {
                MatchmakerEntry pA = queue.get(i);
                // Ventana expande a +15 ELO por segundo
                double deltaA = 100.0 + ((now - pA.entryTime) / 1000.0) * 15.0;
                
                List<Integer> candidateIndices = new ArrayList<>();
                candidateIndices.add(i);
                
                for (int j = 0; j < queue.size(); j++) {
                    if (i == j) continue;
                    MatchmakerEntry pB = queue.get(j);
                    double deltaB = 100.0 + ((now - pB.entryTime) / 1000.0) * 15.0;
                    
                    double eloDiff = Math.abs(pA.elo - pB.elo);
                    if (eloDiff <= Math.max(deltaA, deltaB)) {
                        candidateIndices.add(j);
                    }
                    
                    if (candidateIndices.size() == 4) {
                        break;
                    }
                }
                
                if (candidateIndices.size() == 4) {
                    List<MatchmakerEntry> group = new ArrayList<>();
                    Collections.sort(candidateIndices, Collections.reverseOrder());
                    for (int idx : candidateIndices) {
                        group.add(queue.remove(idx));
                    }
                    
                    // Ordenar por ELO descendente para balancear equipos
                    group.sort((o1, o2) -> Double.compare(o2.elo, o1.elo));
                    
                    MatchmakerEntry p1 = group.get(0);
                    MatchmakerEntry p2 = group.get(1);
                    MatchmakerEntry p3 = group.get(2);
                    MatchmakerEntry p4 = group.get(3);
                    
                    String autoRoomId = "PARTIDA-" + (reyesOption.equals("4") ? "4R-" : "8R-") + (int)Math.floor(100 + Math.random() * 900);
                    GameSession session = createRoom(autoRoomId);
                    session.getConfig().setReyesOption(reyesOption);
                    session.getConfig().setMaxRounds(3);
                    
                    // Asignación balanceada de equipos (Parejas: 0 y 2 vs 1 y 3)
                    // Equipo A = p1 (máx ELO) + p4 (mín ELO)
                    session.addPlayer(0, p1.userId, p1.username);
                    session.addPlayer(2, p4.userId, p4.username);
                    
                    // Equipo B = p2 + p3
                    session.addPlayer(1, p2.userId, p2.username);
                    session.addPlayer(3, p3.userId, p3.username);
                    
                    saveNewGameToDb(session);
                    session.startMatch();
                    
                    Map<String, Object> matchInfo = new HashMap<>();
                    matchInfo.put("roomId", autoRoomId);
                    
                    List<Long> playerIds = new ArrayList<>();
                    playerIds.add(p1.userId);
                    playerIds.add(p2.userId);
                    playerIds.add(p3.userId);
                    playerIds.add(p4.userId);
                    matchInfo.put("playerIds", playerIds);
                    
                    matched.add(matchInfo);
                    foundGroup = true;
                    break;
                }
            }
        }
        return matched;
    }

    public synchronized void removeFromMatchmaking(Long userId) {
        matchmakingQueue4.removeIf(entry -> entry.userId.equals(userId));
        matchmakingQueue8.removeIf(entry -> entry.userId.equals(userId));
    }

    public synchronized int getMatchmakingQueueSize() {
        return getMatchmakingQueueSize("8");
    }

    public synchronized int getMatchmakingQueueSize(String reyesOption) {
        if ("4".equals(reyesOption)) {
            return matchmakingQueue4.size();
        }
        return matchmakingQueue8.size();
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
            GamePlayer p = session.getPlayers().get(playerIdx);
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
        boolean team1Won = session.getScoreUs() >= 30;
        
        // Resolver ELOs y RDs actuales para los 4 asientos
        double ratingA0 = 1500.0;
        double rdA0 = 350.0;
        GamePlayer gp0 = session.getPlayers().get(0);
        if (gp0 != null && !gp0.isBot()) {
            UserGameProfile prof = profileRepository.findById(gp0.getUserId()).orElse(null);
            if (prof != null) {
                ratingA0 = prof.getElo().doubleValue();
                rdA0 = prof.getRatingDeviation();
            }
        }
        
        double ratingA2 = 1500.0;
        double rdA2 = 350.0;
        GamePlayer gp2 = session.getPlayers().get(2);
        if (gp2 != null && !gp2.isBot()) {
            UserGameProfile prof = profileRepository.findById(gp2.getUserId()).orElse(null);
            if (prof != null) {
                ratingA2 = prof.getElo().doubleValue();
                rdA2 = prof.getRatingDeviation();
            }
        }
        
        double ratingB1 = 1500.0;
        double rdB1 = 350.0;
        GamePlayer gp1 = session.getPlayers().get(1);
        if (gp1 != null && !gp1.isBot()) {
            UserGameProfile prof = profileRepository.findById(gp1.getUserId()).orElse(null);
            if (prof != null) {
                ratingB1 = prof.getElo().doubleValue();
                rdB1 = prof.getRatingDeviation();
            }
        }
        
        double ratingB3 = 1500.0;
        double rdB3 = 350.0;
        GamePlayer gp3 = session.getPlayers().get(3);
        if (gp3 != null && !gp3.isBot()) {
            UserGameProfile prof = profileRepository.findById(gp3.getUserId()).orElse(null);
            if (prof != null) {
                ratingB3 = prof.getElo().doubleValue();
                rdB3 = prof.getRatingDeviation();
            }
        }

        // Ratings y RDs compuestos de los equipos
        double ratingTeamA = (ratingA0 + ratingA2) / 2.0;
        double rdTeamA = (rdA0 + rdA2) / 2.0;
        
        double ratingTeamB = (ratingB1 + ratingB3) / 2.0;
        double rdTeamB = (rdB1 + rdB3) / 2.0;

        double scoreTeamA = team1Won ? 1.0 : 0.0;
        double scoreTeamB = 1.0 - scoreTeamA;

        // Procesar cambios para cada usuario real
        for (int chair = 0; chair < 4; chair++) {
            GamePlayer gp = session.getPlayers().get(chair);
            if (gp != null && !gp.isBot() && gp.getUserId() != null) {
                Long uId = gp.getUserId();
                boolean isTeamA = (chair % 2 == 0);
                boolean didWin = (isTeamA == team1Won);
                double outcome = isTeamA ? scoreTeamA : scoreTeamB;
                
                double oppTeamRating = isTeamA ? ratingTeamB : ratingTeamA;
                double oppTeamRd = isTeamA ? rdTeamB : rdTeamA;

                try {
                    UserGameProfile profile = profileRepository.findById(uId)
                            .orElseGet(() -> new UserGameProfile(uId));
                    
                    profile.setTotalGamesPlayed(profile.getTotalGamesPlayed() + 1);
                    if (didWin) {
                        profile.setTotalGamesWon(profile.getTotalGamesWon() + 1);
                    }
                    
                    // Ejecutar actualización de Glicko-2
                    Glicko2Calculator.GlickoResult res = Glicko2Calculator.update(
                        profile.getElo().doubleValue(),
                        profile.getRatingDeviation(),
                        profile.getVolatility(),
                        oppTeamRating,
                        oppTeamRd,
                        outcome
                    );
                    
                    int oldElo = profile.getElo();
                    profile.setElo((int) Math.max(0, Math.round(res.rating)));
                    profile.setRatingDeviation(res.ratingDeviation);
                    profile.setVolatility(res.volatility);
                    
                    // Recompensa de monedas
                    int coinsGained = didWin ? 25 : 5;
                    profile.setCoins(profile.getCoins() + coinsGained);
                    
                    profileRepository.save(profile);
                    session.appendLog(String.format("[BD] Perfil de %s actualizado: ELO %d -> %d (RD: %.1f)", 
                        gp.getUsername(), oldElo, profile.getElo(), profile.getRatingDeviation()));
                } catch (Exception e) {
                    System.err.println("Error updating user statistics in DB: " + e.getMessage());
                }
            }
        }
    }

    @PersistenceContext
    private EntityManager entityManager;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initDatabaseDefaults() {
        try {
            Number countLat = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'local_meetup_ad' AND COLUMN_NAME = 'latitude'"
            ).getSingleResult();
            if (countLat != null && countLat.intValue() == 0) {
                entityManager.createNativeQuery("ALTER TABLE local_meetup_ad ADD COLUMN latitude DOUBLE NULL").executeUpdate();
            }
        } catch (Exception e) {
            System.err.println("Migration check warning (latitude): " + e.getMessage());
        }

        try {
            Number countLng = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'local_meetup_ad' AND COLUMN_NAME = 'longitude'"
            ).getSingleResult();
            if (countLng != null && countLng.intValue() == 0) {
                entityManager.createNativeQuery("ALTER TABLE local_meetup_ad ADD COLUMN longitude DOUBLE NULL").executeUpdate();
            }
        } catch (Exception e) {
            System.err.println("Migration check warning (longitude): " + e.getMessage());
        }

        try {
            Number countSched = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'local_meetup_ad' AND COLUMN_NAME = 'scheduled_at'"
            ).getSingleResult();
            if (countSched != null && countSched.intValue() == 0) {
                entityManager.createNativeQuery("ALTER TABLE local_meetup_ad ADD COLUMN scheduled_at TIMESTAMP NULL").executeUpdate();
            }
        } catch (Exception e) {
            System.err.println("Migration check warning (scheduled_at): " + e.getMessage());
        }

        try {
            Number countType = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'local_meetup_ad' AND COLUMN_NAME = 'establishment_type'"
            ).getSingleResult();
            if (countType != null && countType.intValue() == 0) {
                entityManager.createNativeQuery("ALTER TABLE local_meetup_ad ADD COLUMN establishment_type VARCHAR(50) DEFAULT 'BAR'").executeUpdate();
            }
        } catch (Exception e) {
            System.err.println("Migration check warning (establishment_type): " + e.getMessage());
        }
        System.out.println(">>> [BD] Migraciones de base de datos finalizadas con éxito.");
    }
}
