package com.mus.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mus.backend.engine.GameSession;
import com.mus.backend.engine.GameSessionManager;
import com.mus.backend.service.JwtService;
import com.mus.backend.engine.GamePlayer;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.repository.UserGameProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

@Component
public class MusGameWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private GameSessionManager sessionManager;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserGameProfileRepository profileRepository;

    // Mapea id de sesión de WebSocket a su información de conexión activa
    private final Map<String, UserConnection> activeConnections = new ConcurrentHashMap<>();

    private final ScheduledExecutorService timerScheduler = Executors.newScheduledThreadPool(4);
    private final Map<String, ScheduledFuture<?>> activeTimers = new ConcurrentHashMap<>();
    private final Map<String, ScheduledFuture<?>> leaverTimers = new ConcurrentHashMap<>();

    private static class UserConnection {
        WebSocketSession session;
        Long userId;
        String username;
        String roomId;
        int chair; // -1 if not seated yet
        String reyesOption; // null if not in matchmaking queue
        boolean authenticated;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        UserConnection conn = new UserConnection();
        conn.session = session;
        conn.chair = -1;

        // Read auth from handshake attributes (set by JwtHandshakeInterceptor)
        Map<String, Object> attributes = session.getAttributes();
        Boolean authenticated = (Boolean) attributes.get("authenticated");
        if (Boolean.TRUE.equals(authenticated)) {
            conn.authenticated = true;
            conn.userId = (Long) attributes.get("userId");
            conn.username = (String) attributes.get("username");
        }

        activeConnections.put(session.getId(), conn);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            String payload = message.getPayload();
            Map<String, Object> data = mapper.readValue(payload, Map.class);
            String type = (String) data.get("type");

            UserConnection conn = activeConnections.get(session.getId());
            if (conn == null) return;

            // All actions require authentication
            if (!conn.authenticated && !("JOIN".equals(type) || "MATCHMAKING_JOIN".equals(type))) {
                sendErrorMessage(conn.session, "No autorizado: sesión no autenticada.");
                return;
            }

            if ("JOIN".equals(type)) {
                handleJoinAction(conn, data);
            }
            else if ("MATCHMAKING_JOIN".equals(type)) {
                handleMatchmakingJoin(conn, data);
            }
            else if ("MATCHMAKING_LEAVE".equals(type)) {
                handleMatchmakingLeave(conn);
            }
            else if ("ADD_BOT".equals(type)) {
                handleAddBot(conn, data);
            }
            else if ("REMOVE_BOT".equals(type)) {
                handleRemoveBot(conn, data);
            }
            else if ("START_GAME".equals(type)) {
                handleStartGame(conn);
            }
            else if ("DECISION_MUS".equals(type)) {
                handleMusDecision(conn, data);
            }
            else if ("DISCARD".equals(type)) {
                handleDiscard(conn, data);
            }
            else if ("BET".equals(type)) {
                handleBet(conn, data);
            }
            else if ("UPDATE_CONFIG".equals(type)) {
                handleUpdateConfig(conn, data);
            }
            else if ("CHAT".equals(type)) {
                handleChat(conn, data);
            }
            else if ("SPEECH_BUBBLE".equals(type)) {
                handleSpeechBubble(conn, data);
            }
            else if ("SEND_SIGN".equals(type)) {
                handleSendSign(conn, data);
            }
            else if ("LEAVE_VOTE".equals(type)) {
                handleLeaveVote(conn, data);
            }

        } catch (Exception e) {
            System.err.println("Error handling websocket message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        UserConnection conn = activeConnections.remove(session.getId());
        if (conn != null) {
            // Salir de matchmaking si estaba buscando
            if (conn.userId != null) {
                sessionManager.removeFromMatchmaking(conn.userId);
                if (conn.reyesOption != null) {
                    broadcastQueueSize(conn.reyesOption);
                }
            }

            if (conn.roomId != null) {
                GameSession room = sessionManager.getRoom(conn.roomId);
                if (room != null) {
                    if (room.isPlaying()) {
                        // Iniciar temporizador de abandono de 30 segundos
                        String timerKey = conn.roomId + "_" + conn.userId;
                        ScheduledFuture<?> oldTimer = leaverTimers.remove(timerKey);
                        if (oldTimer != null) {
                            oldTimer.cancel(false);
                        }

                        // Informar desconexión temporal a la mesa
                        Map<String, Object> dcEvent = new HashMap<>();
                        dcEvent.put("type", "PLAYER_DISCONNECTED");
                        dcEvent.put("userId", conn.userId);
                        dcEvent.put("username", conn.username);
                        dcEvent.put("chair", conn.chair);
                        dcEvent.put("timeout", 30);
                        broadcastToRoom(room, dcEvent);

                        ScheduledFuture<?> future = timerScheduler.schedule(() -> {
                            handleAbandonment(conn.roomId, conn.userId, conn.username, conn.chair);
                        }, 30, TimeUnit.SECONDS);
                        leaverTimers.put(timerKey, future);
                    } else {
                        room.removePlayer(conn.chair);
                        broadcastRoomState(room);

                        // Si la sala está vacía de jugadores reales, la eliminamos
                        boolean hasRealPlayers = false;
                        for (GamePlayer gp : room.getPlayers()) {
                            if (gp != null && !gp.isBot()) {
                                hasRealPlayers = true;
                                break;
                            }
                        }
                        if (!hasRealPlayers) {
                            sessionManager.removeRoom(conn.roomId);
                            System.out.println("Sala vacía eliminada: " + conn.roomId);
                            ScheduledFuture<?> future = activeTimers.remove(conn.roomId);
                            if (future != null) {
                                future.cancel(false);
                            }
                        }
                    }
                }
            }
        }
    }

    // --- ACCIONES ESPECÍFICAS ---

    private void handleJoinAction(UserConnection conn, Map<String, Object> data) {
        String roomId = ((String) data.get("roomId")).toUpperCase().trim();

        // Auth is now from handshake; if not authenticated, reject
        if (!conn.authenticated || conn.userId == null) {
            sendErrorMessage(conn.session, "No autorizado: sesión no autenticada.");
            return;
        }

        Long userId = conn.userId;
        String username = conn.username;

        conn.roomId = roomId;

        GameSession room = sessionManager.createRoom(roomId);

        // Evitamos que el mismo jugador se siente dos veces
        int seatedChair = -1;
        for (int i = 0; i < 4; i++) {
            GamePlayer gp = room.getPlayers().get(i);
            if (gp != null && userId.equals(gp.getUserId())) {
                seatedChair = i;
                break;
            }
        }

        if (seatedChair == -1) {
            seatedChair = room.getFreeChair();
            if (seatedChair != -1) {
                room.addPlayer(seatedChair, userId, username);
            } else {
                sendErrorMessage(conn.session, "La sala está llena.");
                return;
            }
        }

        conn.chair = seatedChair;

        // Cancelar temporizador de desconexión temporal si el jugador vuelve
        String timerKey = roomId + "_" + userId;
        ScheduledFuture<?> activeDcTimer = leaverTimers.remove(timerKey);
        if (activeDcTimer != null) {
            activeDcTimer.cancel(false);

            // Informar reconexión a la mesa
            Map<String, Object> rcEvent = new HashMap<>();
            rcEvent.put("type", "PLAYER_RECONNECTED");
            rcEvent.put("userId", userId);
            rcEvent.put("username", username);
            rcEvent.put("chair", seatedChair);
            broadcastToRoom(room, rcEvent);
        }

        broadcastRoomState(room);

        // Si es una sala de torneo, iniciar la partida automáticamente cuando todos los jugadores reales estén conectados
        if (roomId.startsWith("TORNEO-")) {
            boolean allHumanPlayersConnected = true;
            for (int i = 0; i < 4; i++) {
                GamePlayer gp = room.getPlayers().get(i);
                if (gp != null && !gp.isBot() && gp.getUserId() != null) {
                    boolean connected = false;
                    for (UserConnection c : activeConnections.values()) {
                        if (roomId.equalsIgnoreCase(c.roomId) && gp.getUserId().equals(c.userId) && c.session.isOpen()) {
                            connected = true;
                            break;
                        }
                    }
                    if (!connected) {
                        allHumanPlayersConnected = false;
                        break;
                    }
                }
            }

            if (allHumanPlayersConnected && !room.isPlaying()) {
                // Persistir la partida en la Base de Datos antes de empezar
                sessionManager.saveNewGameToDb(room);

                room.startMatch();
                broadcastRoomState(room);
                triggerBotTurnsRecursively(room);
                startTurnTimer(room);
            }
        }
    }

    private void handleMatchmakingJoin(UserConnection conn, Map<String, Object> data) {
        // Auth is now from handshake
        if (!conn.authenticated || conn.userId == null) {
            sendErrorMessage(conn.session, "No autorizado: sesión no autenticada.");
            return;
        }

        Long userId = conn.userId;
        String username = conn.username;
        String reyesOption = data.containsKey("reyesOption") ? (String) data.get("reyesOption") : "8";

        conn.reyesOption = reyesOption;

        try {
            sessionManager.addToMatchmaking(userId, username, reyesOption);
            // Confirmamos que está en cola a todos los miembros de esa cola
            broadcastQueueSize(reyesOption);
        } catch (Exception e) {
            sendErrorMessage(conn.session, e.getMessage());
        }
    }

    private void handleUpdateConfig(UserConnection conn, Map<String, Object> data) {
        if (conn.roomId == null) return;
        GameSession room = sessionManager.getRoom(conn.roomId);
        if (room == null || room.isPlaying()) return;

        if (conn.chair == -1) return;

        if (data.containsKey("reyesOption")) {
            String reyesOption = (String) data.get("reyesOption");
            room.getConfig().setReyesOption(reyesOption);
        }
        if (data.containsKey("maxRounds")) {
            int maxRounds = Integer.parseInt(data.get("maxRounds").toString());
            room.getConfig().setMaxRounds(maxRounds);
        }

        broadcastRoomState(room);
    }

    private void handleMatchmakingLeave(UserConnection conn) {
        if (conn.userId != null) {
            sessionManager.removeFromMatchmaking(conn.userId);
            Map<String, Object> leaveEvent = new HashMap<>();
            leaveEvent.put("type", "LEAVED_QUEUE");
            sendJsonMessage(conn.session, leaveEvent);

            if (conn.reyesOption != null) {
                String reyes = conn.reyesOption;
                conn.reyesOption = null;
                broadcastQueueSize(reyes);
            }
        }
    }

    private void handleAddBot(UserConnection conn, Map<String, Object> data) {
        if (conn.roomId == null) return;
        GameSession room = sessionManager.getRoom(conn.roomId);
        if (room == null || room.isPlaying()) return;

        int chair = Integer.parseInt(data.get("chair").toString());
        room.addBot(chair);
        broadcastRoomState(room);
    }

    private void handleRemoveBot(UserConnection conn, Map<String, Object> data) {
        if (conn.roomId == null) return;
        GameSession room = sessionManager.getRoom(conn.roomId);
        if (room == null || room.isPlaying()) return;

        int chair = Integer.parseInt(data.get("chair").toString());
        GamePlayer gp = room.getPlayers().get(chair);
        if (gp != null && gp.isBot()) {
            room.removePlayer(chair);
            broadcastRoomState(room);
        }
    }

    private void handleStartGame(UserConnection conn) {
        if (conn.roomId == null) return;
        GameSession room = sessionManager.getRoom(conn.roomId);
        if (room == null) return;

        if (room.isPlaying()) {
            if ("round-over".equals(room.getPhase())) {
                room.startNewHand();
                broadcastRoomState(room);
                triggerBotTurnsRecursively(room);
                startTurnTimer(room);
            }
            return;
        }

        // Persistir la partida en la Base de Datos antes de empezar
        sessionManager.saveNewGameToDb(room);

        room.startMatch();
        broadcastRoomState(room);

        // Si le toca a un Bot, lo automatizamos
        triggerBotTurnsRecursively(room);
        startTurnTimer(room);
    }

    private void handleMusDecision(UserConnection conn, Map<String, Object> data) {
        if (conn.roomId == null) return;
        GameSession room = sessionManager.getRoom(conn.roomId);
        if (room == null || conn.chair != room.getActiveTurnIdx()) return;

        boolean wantsMus = (Boolean) data.get("wantsMus");

        // Log action
        sessionManager.logActionToDb(room, conn.chair, wantsMus ? "Mus" : "Corto");

        room.handleMusDecision(conn.chair, wantsMus);
        broadcastRoomState(room);

        // Disparar las IAs si es su turno
        triggerBotTurnsRecursively(room);
        startTurnTimer(room);
    }

    private void handleDiscard(UserConnection conn, Map<String, Object> data) {
        if (conn.roomId == null) return;
        GameSession room = sessionManager.getRoom(conn.roomId);
        if (room == null || conn.chair != room.getActiveTurnIdx()) return;

        List<String> cardIds = (List<String>) data.get("cardIds");

        // Log action
        sessionManager.logActionToDb(room, conn.chair, "Se descarta de " + cardIds.size() + " cartas.");

        room.handleDiscards(conn.chair, cardIds);
        broadcastRoomState(room);

        triggerBotTurnsRecursively(room);
        startTurnTimer(room);
    }

    private void handleBet(UserConnection conn, Map<String, Object> data) {
        if (conn.roomId == null) return;
        GameSession room = sessionManager.getRoom(conn.roomId);
        if (room == null || conn.chair != room.getActiveTurnIdx()) return;

        String action = (String) data.get("action");

        // Log action
        sessionManager.logActionToDb(room, conn.chair, "Apuesta: " + action);

        room.handleBetAction(conn.chair, action);

        // Sincronizar puntuación si termina la ronda
        sessionManager.updateGameScoresInDb(room);

        broadcastRoomState(room);

        triggerBotTurnsRecursively(room);
        startTurnTimer(room);
    }

    private void handleChat(UserConnection conn, Map<String, Object> data) {
        if (conn.roomId == null) return;
        GameSession room = sessionManager.getRoom(conn.roomId);
        if (room == null) return;

        String message = (String) data.get("message");
        room.appendChatMessage("[Chair:" + conn.chair + "] " + conn.username + ": " + message);
        broadcastRoomState(room);
    }

    // --- AUTOMATIZACIÓN DE BOTS ---

    private void triggerBotTurnsRecursively(GameSession room) {
        // Ejecutamos en un hilo separado o con una pequeña pausa para simular realismo en la IA
        new Thread(() -> {
            boolean acted = true;
            while (acted) {
                try {
                    Thread.sleep(1000); // 1 segundo de retraso para dar sensación de juego real
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }

                int preTurnIdx = room.getActiveTurnIdx();
                String prePhase = room.getPhase();

                // Intentamos ejecutar el turno del Bot en el motor
                acted = room.runBotTurnIfActive();

                if (acted) {
                    // Log del Bot en BD
                    sessionManager.logActionToDb(room, preTurnIdx, "Bot auto-actúa en " + prePhase);

                    // Sincronizar puntuaciones si ha cambiado a round-over
                    sessionManager.updateGameScoresInDb(room);

                    // Notificamos a todos el nuevo estado
                    broadcastRoomState(room);

                    // Turn advanced, reset timer for human player if next
                    startTurnTimer(room);
                }
            }
        }).start();
    }

    // --- EMISIÓN DE MENSAJES ---

    private void broadcastRoomState(GameSession room) {
        for (UserConnection conn : activeConnections.values()) {
            if (room.getRoomId().equals(conn.roomId)) {
                try {
                    // Genera estado a la medida de la silla para evitar trampas
                    Map<String, Object> state = room.toClientState(conn.chair);
                    state.put("type", "ROOM_STATE");

                    String json = mapper.writeValueAsString(state);
                    synchronized (conn.session) {
                        if (conn.session.isOpen()) {
                            conn.session.sendMessage(new TextMessage(json));
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error broadcasting state to " + conn.username + ": " + e.getMessage());
                }
            }
        }
    }

    private void sendJsonMessage(WebSocketSession session, Map<String, Object> data) {
        try {
            String json = mapper.writeValueAsString(data);
            synchronized (session) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void sendErrorMessage(WebSocketSession session, String errorMsg) {
        try {
            Map<String, Object> errorMap = new HashMap<>();
            errorMap.put("type", "ERROR");
            errorMap.put("message", errorMsg);
            synchronized (session) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(mapper.writeValueAsString(errorMap)));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    // --- TIMER Y SEÑAS HELPER METHODS ---

    private void startTurnTimer(GameSession room) {
        String roomId = room.getRoomId();

        // Cancel existing timer
        ScheduledFuture<?> oldTimer = activeTimers.remove(roomId);
        if (oldTimer != null) {
            oldTimer.cancel(false);
        }

        if (!room.isPlaying() || "round-over".equals(room.getPhase())) {
            room.setTurnDeadline(0);
            return;
        }

        int activeIdx = room.getActiveTurnIdx();
        GamePlayer activePlayer = room.getPlayers().get(activeIdx);
        if (activePlayer == null || activePlayer.isBot()) {
            room.setTurnDeadline(0);
            return;
        }

        // 10 seconds limit
        int limitSeconds = 10;
        long deadline = System.currentTimeMillis() + (limitSeconds * 1000);
        room.setTurnDeadline(deadline);

        // Broadcast immediately so clients get the new turnDeadline
        broadcastRoomState(room);

        ScheduledFuture<?> future = timerScheduler.schedule(() -> {
            try {
                executeTimeout(room, activeIdx);
            } catch (Exception e) {
                System.err.println("Error executing timeout: " + e.getMessage());
            }
        }, limitSeconds, TimeUnit.SECONDS);

        activeTimers.put(roomId, future);
    }

    private void executeTimeout(GameSession room, int playerIdx) {
        if (!room.isPlaying() || room.getActiveTurnIdx() != playerIdx) return;

        String phase = room.getPhase();
        String actionDesc = "";

        if ("mus-check".equals(phase)) {
            actionDesc = "Corto (Tiempo expirado)";
            sessionManager.logActionToDb(room, playerIdx, actionDesc);
            room.handleMusDecision(playerIdx, false); // Wants mus = false -> Corto
        }
        else if ("discarding".equals(phase)) {
            actionDesc = "Descarte 0 (Tiempo expirado)";
            sessionManager.logActionToDb(room, playerIdx, actionDesc);
            room.handleDiscards(playerIdx, new ArrayList<>()); // Discard 0
        }
        else if ("betting".equals(phase)) {
            if (room.getBetState() > 0) {
                actionDesc = "No Quiero (Tiempo expirado)";
                sessionManager.logActionToDb(room, playerIdx, actionDesc);
                room.handleBetAction(playerIdx, "No Quiero");
            } else {
                actionDesc = "Paso (Tiempo expirado)";
                sessionManager.logActionToDb(room, playerIdx, actionDesc);
                room.handleBetAction(playerIdx, "Paso");
            }
        } else {
            return;
        }

        sessionManager.updateGameScoresInDb(room);
        broadcastRoomState(room);
        triggerBotTurnsRecursively(room);
        startTurnTimer(room);
    }

    private void handleSpeechBubble(UserConnection conn, Map<String, Object> data) {
        if (conn.roomId == null || conn.chair == -1) return;
        GameSession room = sessionManager.getRoom(conn.roomId);
        if (room == null) return;

        String message = (String) data.get("message");
        GamePlayer gp = room.getPlayers().get(conn.chair);
        if (gp != null) {
            gp.setSpeechBubble(message);
            room.appendChatMessage("[Chair:" + conn.chair + "] " + conn.username + ": " + message);
            broadcastRoomState(room);

            final int chair = conn.chair;
            timerScheduler.schedule(() -> {
                if (room.getPlayers().get(chair) == gp && message.equals(gp.getSpeechBubble())) {
                    gp.setSpeechBubble("");
                    broadcastRoomState(room);
                }
            }, 3, TimeUnit.SECONDS);
        }
    }

    private void handleSendSign(UserConnection conn, Map<String, Object> data) {
        if (conn.roomId == null || conn.chair == -1) return;
        GameSession room = sessionManager.getRoom(conn.roomId);
        if (room == null) return;

        String signType = (String) data.get("signType");

        // Broadcast sign event to all users in the room
        Map<String, Object> signEvent = new HashMap<>();
        signEvent.put("type", "MUS_SIGN");
        signEvent.put("chair", conn.chair);
        signEvent.put("signType", signType);
        signEvent.put("username", conn.username);

        for (UserConnection otherConn : activeConnections.values()) {
            if (conn.roomId.equals(otherConn.roomId)) {
                sendJsonMessage(otherConn.session, signEvent);
            }
        }
    }

    private void handleLeaveVote(UserConnection conn, Map<String, Object> data) {
        if (conn.roomId == null || conn.chair == -1) return;
        GameSession room = sessionManager.getRoom(conn.roomId);
        if (room == null || !room.isPlaying()) return;

        boolean vote = (Boolean) data.get("vote");
        if (vote) {
            room.addLeaveVote(conn.chair);
            room.appendLog(conn.username + " ha votado para salir de la partida de mutuo acuerdo.");
        } else {
            room.removeLeaveVote(conn.chair);
            room.appendLog(conn.username + " ha retirado su voto de salida.");
        }

        if (room.hasBothTeamsVotedToLeave()) {
            room.setPlaying(false);
            room.appendLog("Partida cancelada de mutuo acuerdo.");
            sessionManager.cancelGameInDb(room);

            Map<String, Object> cancelEvent = new HashMap<>();
            cancelEvent.put("type", "GAME_CANCELLED");
            broadcastToRoom(room, cancelEvent);

            ScheduledFuture<?> future = activeTimers.remove(conn.roomId);
            if (future != null) {
                future.cancel(false);
            }

            // Clean up the room after a delay
            timerScheduler.schedule(() -> {
                sessionManager.removeRoom(conn.roomId);
            }, 3, TimeUnit.SECONDS);
        } else {
            broadcastRoomState(room);
        }
    }

    // --- GESTIÓN DE ABANDONO Y SCHEDULER DE MATCHMAKING ---

    private void broadcastToRoom(GameSession room, Map<String, Object> data) {
        for (UserConnection conn : activeConnections.values()) {
            if (room.getRoomId().equalsIgnoreCase(conn.roomId)) {
                sendJsonMessage(conn.session, data);
            }
        }
    }

    private void broadcastQueueSize(String reyesOption) {
        List<Long> queueUserIds = sessionManager.getMatchmakingUserIds(reyesOption);
        Map<String, Object> queueEvent = new HashMap<>();
        queueEvent.put("type", "QUEUEING");
        queueEvent.put("queueSize", queueUserIds.size());

        for (UserConnection conn : activeConnections.values()) {
            if (conn.userId != null && queueUserIds.contains(conn.userId)) {
                sendJsonMessage(conn.session, queueEvent);
            }
        }
    }

    private void handleAbandonment(String roomId, Long userId, String username, int chair) {
        leaverTimers.remove(roomId + "_" + userId);

        // Verificar si el jugador ya se reconectó
        boolean reconnected = false;
        for (UserConnection activeConn : activeConnections.values()) {
            if (userId.equals(activeConn.userId) && roomId.equalsIgnoreCase(activeConn.roomId) && activeConn.session.isOpen()) {
                reconnected = true;
                break;
            }
        }

        if (reconnected) {
            return; // Ya se reconectó
        }

        GameSession room = sessionManager.getRoom(roomId);
        if (room != null && room.isPlaying()) {
            room.appendLog("⚠️ " + username + " abandonó la partida.");

            // Declarar ganadores a los rivales (Parejas: 0 y 2 vs 1 y 3)
            boolean isTeamA = (chair % 2 == 0);
            if (isTeamA) {
                room.setScoreThem(30);
                room.setScoreUs(Math.min(room.getScoreUs(), 29));
            } else {
                room.setScoreUs(30);
                room.setScoreThem(Math.min(room.getScoreThem(), 29));
            }
            room.setPlaying(false);

            // Aplicar penalización por abandono en base de datos
            try {
                UserGameProfile profile = profileRepository.findById(userId).orElse(null);
                if (profile != null) {
                    profile.setTotalGamesPlayed(profile.getTotalGamesPlayed() + 1);
                    profile.setAbandonedGamesCount(profile.getAbandonedGamesCount() + 1);
                    profile.setIsLowPriority(true);
                    profile.setMatchmakingBanUntil(LocalDateTime.now().plusMinutes(5));

                    // Calcular pérdida de ELO duplicada (Derrota Glicko-2 * 2)
                    double ratingA0 = 1500.0; double rdA0 = 350.0;
                    GamePlayer gp0 = room.getPlayers().get(0);
                    if (gp0 != null && !gp0.isBot()) {
                        UserGameProfile prof = profileRepository.findById(gp0.getUserId()).orElse(null);
                        if (prof != null) { ratingA0 = prof.getElo().doubleValue(); rdA0 = prof.getRatingDeviation(); }
                    }
                    double ratingA2 = 1500.0; double rdA2 = 350.0;
                    GamePlayer gp2 = room.getPlayers().get(2);
                    if (gp2 != null && !gp2.isBot()) {
                        UserGameProfile prof = profileRepository.findById(gp2.getUserId()).orElse(null);
                        if (prof != null) { ratingA2 = prof.getElo().doubleValue(); rdA2 = prof.getRatingDeviation(); }
                    }
                    double ratingB1 = 1500.0; double rdB1 = 350.0;
                    GamePlayer gp1 = room.getPlayers().get(1);
                    if (gp1 != null && !gp1.isBot()) {
                        UserGameProfile prof = profileRepository.findById(gp1.getUserId()).orElse(null);
                        if (prof != null) { ratingB1 = prof.getElo().doubleValue(); rdB1 = prof.getRatingDeviation(); }
                    }
                    double ratingB3 = 1500.0; double rdB3 = 350.0;
                    GamePlayer gp3 = room.getPlayers().get(3);
                    if (gp3 != null && !gp3.isBot()) {
                        UserGameProfile prof = profileRepository.findById(gp3.getUserId()).orElse(null);
                        if (prof != null) { ratingB3 = prof.getElo().doubleValue(); rdB3 = prof.getRatingDeviation(); }
                    }

                    double oppTeamRating = isTeamA ? (ratingB1 + ratingB3) / 2.0 : (ratingA0 + ratingA2) / 2.0;
                    double oppTeamRd = isTeamA ? (rdB1 + rdB3) / 2.0 : (rdA0 + rdA2) / 2.0;

                    com.mus.backend.engine.Glicko2Calculator.GlickoResult res = com.mus.backend.engine.Glicko2Calculator.update(
                        profile.getElo().doubleValue(),
                        profile.getRatingDeviation(),
                        profile.getVolatility(),
                        oppTeamRating,
                        oppTeamRd,
                        0.0 // Derrota
                    );

                    int oldElo = profile.getElo();
                    int expectedLoss = (int) Math.round(profile.getElo() - res.rating);
                    if (expectedLoss <= 0) expectedLoss = 15;
                    int penalization = expectedLoss * 2;

                    profile.setElo((int) Math.max(0, oldElo - penalization));
                    profile.setRatingDeviation(res.ratingDeviation);
                    profile.setVolatility(res.volatility);

                    profileRepository.save(profile);
                    room.appendLog("[BD] Desertor " + username + " penalizado: ELO " + oldElo + " -> " + profile.getElo() + " (-" + penalization + " ELO)");
                   }
               } catch (Exception e) {
                   System.err.println("Error penalizando abandono: " + e.getMessage());
               }

               // Persistir puntuación final
               sessionManager.updateGameScoresInDb(room);

               // Notificar
               Map<String, Object> abEvent = new HashMap<>();
               abEvent.put("type", "GAME_OVER_ABANDON");
               abEvent.put("leaverUserId", userId);
               abEvent.put("leaverUsername", username);
               broadcastToRoom(room, abEvent);

               // Limpiar la sala con retardo
               timerScheduler.schedule(() -> {
                   sessionManager.removeRoom(roomId);
               }, 3, TimeUnit.SECONDS);
           }
       }

       @Scheduled(fixedDelay = 3000)
       public void processMatchmakingQueue() {
           List<Map<String, Object>> matches = sessionManager.runMatchmakingStep();
           if (matches == null || matches.isEmpty()) {
               return;
           }

           // Broadcast the new queue sizes to remaining players since some got matched and removed
           broadcastQueueSize("8");
           broadcastQueueSize("4");

           for (Map<String, Object> match : matches) {
               String roomId = (String) match.get("roomId");
               List<Long> playerIds = (List<Long>) match.get("playerIds");

               GameSession room = sessionManager.getRoom(roomId);
               if (room == null) continue;

               // Assign WebSocket connections to their chairs in the room
               for (UserConnection otherConn : activeConnections.values()) {
                   if (otherConn.roomId == null && otherConn.userId != null) {
                       if (playerIds.contains(otherConn.userId)) {
                           int chair = -1;
                           for (int i = 0; i < 4; i++) {
                               GamePlayer gp = room.getPlayers().get(i);
                               if (gp != null && gp.getUserId().equals(otherConn.userId)) {
                                   chair = i;
                                   break;
                               }
                           }

                           if (chair != -1) {
                               otherConn.roomId = roomId;
                               otherConn.chair = chair;
                               otherConn.reyesOption = null;

                               Map<String, Object> matchEvent = new HashMap<>();
                               matchEvent.put("type", "MATCHED");
                               matchEvent.put("roomId", roomId);
                               matchEvent.put("chair", chair);

                               sendJsonMessage(otherConn.session, matchEvent);
                           }
                       }
                   }
               }

               // Start the match now that all players are assigned
               room.startMatch();
               broadcastRoomState(room);
               triggerBotTurnsRecursively(room);
               startTurnTimer(room);
           }
       }
   }
