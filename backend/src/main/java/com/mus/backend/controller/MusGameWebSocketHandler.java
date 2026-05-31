package com.mus.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mus.backend.engine.GameSession;
import com.mus.backend.engine.GameSessionManager;
import com.mus.backend.service.JwtService;
import com.mus.backend.engine.GamePlayer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.*;

@Component
public class MusGameWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private GameSessionManager sessionManager;

    @Autowired
    private JwtService jwtService;

    // Mapea id de sesión de WebSocket a su información de conexión activa
    private final Map<String, UserConnection> activeConnections = new ConcurrentHashMap<>();

    private final ScheduledExecutorService timerScheduler = Executors.newScheduledThreadPool(4);
    private final Map<String, ScheduledFuture<?>> activeTimers = new ConcurrentHashMap<>();

    private static class UserConnection {
        WebSocketSession session;
        Long userId;
        String username;
        String roomId;
        int chair; // -1 if not seated yet
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        UserConnection conn = new UserConnection();
        conn.session = session;
        conn.chair = -1;
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
            sessionManager.removeFromMatchmaking(conn.userId);

            if (conn.roomId != null) {
                GameSession room = sessionManager.getRoom(conn.roomId);
                if (room != null) {
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
                    } else {
                        if (!room.isPlaying()) {
                            ScheduledFuture<?> future = activeTimers.remove(conn.roomId);
                            if (future != null) {
                                future.cancel(false);
                            }
                        } else {
                            startTurnTimer(room);
                        }
                    }
                }
            }
        }
    }

    // --- ACCIONES ESPECÍFICAS ---

    private void handleJoinAction(UserConnection conn, Map<String, Object> data) {
        String roomId = ((String) data.get("roomId")).toUpperCase().trim();
        
        String token = (String) data.get("token");
        if (token == null || !jwtService.isTokenValid(token)) {
            sendErrorMessage(conn.session, "No autorizado: token inválido o ausente.");
            return;
        }
        Long userId = jwtService.extractUserId(token);
        String username = jwtService.extractUsername(token);


        conn.userId = userId;
        conn.username = username;
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
        broadcastRoomState(room);
    }

    private void handleMatchmakingJoin(UserConnection conn, Map<String, Object> data) {
        String token = (String) data.get("token");
        if (token == null || !jwtService.isTokenValid(token)) {
            sendErrorMessage(conn.session, "No autorizado: token inválido o ausente.");
            return;
        }
        Long userId = jwtService.extractUserId(token);
        String username = jwtService.extractUsername(token);
        String reyesOption = data.containsKey("reyesOption") ? (String) data.get("reyesOption") : "8";
        
        conn.userId = userId;
        conn.username = username;

        String matchedRoomId = sessionManager.addToMatchmaking(userId, username, reyesOption);
        if (matchedRoomId != null) {
            // Match encontrado! Informamos a los 4 jugadores
            Map<String, Object> matchEvent = new HashMap<>();
            matchEvent.put("type", "MATCHED");
            matchEvent.put("roomId", matchedRoomId);
            
            // Enviamos el evento a todos los sockets de los jugadores
            for (UserConnection otherConn : activeConnections.values()) {
                if (otherConn.roomId == null && otherConn.userId != null) {
                    GameSession room = sessionManager.getRoom(matchedRoomId);
                    if (room != null) {
                        for (GamePlayer gp : room.getPlayers()) {
                            if (gp != null && gp.getUserId().equals(otherConn.userId)) {
                                otherConn.roomId = matchedRoomId;
                                otherConn.chair = room.getPlayers().indexOf(gp);
                                sendJsonMessage(otherConn.session, matchEvent);
                            }
                        }
                    }
                }
            }
        } else {
            // Confirmamos que está en cola
            Map<String, Object> queueEvent = new HashMap<>();
            queueEvent.put("type", "QUEUEING");
            queueEvent.put("queueSize", sessionManager.getMatchmakingQueueSize(reyesOption));
            sendJsonMessage(conn.session, queueEvent);
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
                    if (conn.session.isOpen()) {
                        conn.session.sendMessage(new TextMessage(json));
                    }
                } catch (IOException e) {
                    System.err.println("Error broadcasting state to " + conn.username + ": " + e.getMessage());
                }
            }
        }
    }

    private void sendJsonMessage(WebSocketSession session, Map<String, Object> data) {
        try {
            String json = mapper.writeValueAsString(data);
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void sendErrorMessage(WebSocketSession session, String errorMsg) {
        try {
            Map<String, Object> errorMap = new HashMap<>();
            errorMap.put("type", "ERROR");
            errorMap.put("message", errorMsg);
            session.sendMessage(new TextMessage(mapper.writeValueAsString(errorMap)));
        } catch (IOException e) {
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
}
