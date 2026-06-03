package com.mus.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mus.backend.model.DirectMessage;
import com.mus.backend.model.MeetupMessage;
import com.mus.backend.model.Usuario;
import com.mus.backend.repository.DirectMessageRepository;
import com.mus.backend.repository.MeetupMessageRepository;
import com.mus.backend.repository.UsuarioRepository;
import com.mus.backend.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Autowired
    private JwtService jwtService;

    @Autowired
    private DirectMessageRepository directMessageRepository;

    @Autowired
    private MeetupMessageRepository meetupMessageRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Mapea userId -> WebSocketSession activa
    private final Map<Long, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    // Mapea sessionId -> userId
    private final Map<String, Long> sessionToUser = new ConcurrentHashMap<>();

    // Mapea meetupId -> Set de sesiones activas en esa sala de quedada
    private final Map<Long, Set<WebSocketSession>> meetupRooms = new ConcurrentHashMap<>();

    @Autowired
    private com.mus.backend.service.FriendshipService friendshipService;

    // Registry of user presence
    private static final Set<Long> onlineUsers = ConcurrentHashMap.newKeySet();

    public static boolean isUserOnline(Long userId) {
        return userId != null && onlineUsers.contains(userId);
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println(">>> [WS-CHAT] Conexión establecida desde la sesión: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        System.out.println(">>> [WS-CHAT] Mensaje recibido de " + session.getId() + ": " + message.getPayload());
        try {
            String payload = message.getPayload();
            Map<String, Object> data = mapper.readValue(payload, Map.class);
            String type = (String) data.get("type");

            if ("IDENTIFY".equals(type)) {
                handleIdentify(session, data);
            } else {
                // Verificar si la sesión ya está identificada
                Long senderId = sessionToUser.get(session.getId());
                if (senderId == null) {
                    sendErrorMessage(session, "No identificado. Envía primero una acción IDENTIFY.");
                    return;
                }

                if ("SEND_DM".equals(type)) {
                    handleSendDm(senderId, session, data);
                } else if ("JOIN_MEETUP".equals(type)) {
                    handleJoinMeetup(session, data);
                } else if ("LEAVE_MEETUP".equals(type)) {
                    handleLeaveMeetup(session, data);
                } else if ("SEND_MEETUP_MSG".equals(type)) {
                    handleSendMeetupMsg(senderId, session, data);
                }
            }
        } catch (Exception e) {
            System.err.println("Error en el ChatWebSocketHandler: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        System.out.println(">>> [WS-CHAT] Conexión cerrada. Sesión: " + session.getId() + ", Estado: " + status);
        Long userId = sessionToUser.remove(session.getId());
        if (userId != null) {
            userSessions.remove(userId);
            onlineUsers.remove(userId);

            // Notify friends that this user is offline
            try {
                String username = usuarioRepository.findById(userId).map(Usuario::getUsername).orElse("Usuario");
                List<com.mus.backend.controller.FriendshipController.FriendResponse> friends = friendshipService.getFriends(userId);
                for (com.mus.backend.controller.FriendshipController.FriendResponse f : friends) {
                    WebSocketSession friendSession = userSessions.get(f.id);
                    if (friendSession != null && friendSession.isOpen()) {
                        Map<String, Object> presenceEvent = new HashMap<>();
                        presenceEvent.put("type", "PRESENCE_CHANGE");
                        presenceEvent.put("userId", userId);
                        presenceEvent.put("username", username);
                        presenceEvent.put("status", "offline");
                        sendJsonMessage(friendSession, presenceEvent);
                    }
                }
            } catch (Exception e) {
                System.err.println("Error broadcasting offline presence: " + e.getMessage());
            }
        }

        // Limpiar subscripciones en salas de quedadas
        for (Set<WebSocketSession> sessions : meetupRooms.values()) {
            sessions.remove(session);
        }
    }

    // --- ACCIONES ESPECÍFICAS ---

    private void handleIdentify(WebSocketSession session, Map<String, Object> data) {
        String token = (String) data.get("token");
        if (token == null || !jwtService.isTokenValid(token)) {
            sendErrorMessage(session, "Token inválido o ausente.");
            try {
                session.close(CloseStatus.NOT_ACCEPTABLE);
            } catch (IOException ignored) {}
            return;
        }

        Long userId = jwtService.extractUserId(token);
        String username = jwtService.extractUsername(token);

        userSessions.put(userId, session);
        sessionToUser.put(session.getId(), userId);
        onlineUsers.add(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("type", "IDENTIFIED");
        response.put("userId", userId);
        response.put("username", username);
        sendJsonMessage(session, response);

        // Notify friends that this user is online
        try {
            List<com.mus.backend.controller.FriendshipController.FriendResponse> friends = friendshipService.getFriends(userId);
            for (com.mus.backend.controller.FriendshipController.FriendResponse f : friends) {
                WebSocketSession friendSession = userSessions.get(f.id);
                if (friendSession != null && friendSession.isOpen()) {
                    Map<String, Object> presenceEvent = new HashMap<>();
                    presenceEvent.put("type", "PRESENCE_CHANGE");
                    presenceEvent.put("userId", userId);
                    presenceEvent.put("username", username);
                    presenceEvent.put("status", "online");
                    sendJsonMessage(friendSession, presenceEvent);
                }
            }
        } catch (Exception e) {
            System.err.println("Error broadcasting online presence: " + e.getMessage());
        }
    }

    private void handleSendDm(Long senderId, WebSocketSession session, Map<String, Object> data) {
        Long receiverId = Long.valueOf(data.get("receiverId").toString());
        String content = (String) data.get("content");

        if (content == null || content.trim().isEmpty()) {
            sendErrorMessage(session, "El contenido del mensaje no puede estar vacío.");
            return;
        }

        Optional<Usuario> receiverOpt = usuarioRepository.findById(receiverId);
        if (receiverOpt.isEmpty()) {
            sendErrorMessage(session, "Usuario receptor no encontrado.");
            return;
        }

        Optional<Usuario> senderOpt = usuarioRepository.findById(senderId);
        if (senderOpt.isEmpty()) {
            sendErrorMessage(session, "Usuario emisor no encontrado.");
            return;
        }

        // Verify no block relationship exists
        if (friendshipService.hasBlockRelationship(senderId, receiverId)) {
            sendErrorMessage(session, "No puedes chatear con un usuario bloqueado.");
            return;
        }

        // Crear y guardar el mensaje directo
        DirectMessage dm = new DirectMessage();
        dm.setSenderId(senderId);
        dm.setReceiverId(receiverId);
        dm.setContent(content.trim());
        dm.setSentAt(LocalDateTime.now());
        
        DirectMessage saved = directMessageRepository.save(dm);

        // Adjuntar emisor y receptor para el DTO
        saved.setSender(senderOpt.get());
        saved.setReceiver(receiverOpt.get());

        Map<String, Object> event = new HashMap<>();
        event.put("type", "DM_RECEIVED");
        event.put("message", saved);

        // Enviar al receptor si está conectado
        WebSocketSession receiverSession = userSessions.get(receiverId);
        if (receiverSession != null && receiverSession.isOpen()) {
            sendJsonMessage(receiverSession, event);
        }

        // Enviar confirmación al emisor
        Map<String, Object> confirmEvent = new HashMap<>();
        confirmEvent.put("type", "DM_SENT");
        confirmEvent.put("message", saved);
        sendJsonMessage(session, confirmEvent);
    }

    private void handleJoinMeetup(WebSocketSession session, Map<String, Object> data) {
        Long meetupId = Long.valueOf(data.get("meetupId").toString());
        
        meetupRooms.computeIfAbsent(meetupId, k -> ConcurrentHashMap.newKeySet()).add(session);
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "JOINED_MEETUP");
        response.put("meetupId", meetupId);
        sendJsonMessage(session, response);
    }

    private void handleLeaveMeetup(WebSocketSession session, Map<String, Object> data) {
        Long meetupId = Long.valueOf(data.get("meetupId").toString());
        
        Set<WebSocketSession> sessions = meetupRooms.get(meetupId);
        if (sessions != null) {
            sessions.remove(session);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("type", "LEFT_MEETUP");
        response.put("meetupId", meetupId);
        sendJsonMessage(session, response);
    }

    private void handleSendMeetupMsg(Long senderId, WebSocketSession session, Map<String, Object> data) {
        Long meetupId = Long.valueOf(data.get("meetupId").toString());
        String content = (String) data.get("content");

        if (content == null || content.trim().isEmpty()) {
            sendErrorMessage(session, "El contenido del mensaje no puede estar vacío.");
            return;
        }

        Optional<Usuario> userOpt = usuarioRepository.findById(senderId);
        if (userOpt.isEmpty()) {
            sendErrorMessage(session, "Usuario no encontrado.");
            return;
        }

        // Crear y guardar el mensaje de quedada
        MeetupMessage msg = new MeetupMessage();
        msg.setAdId(meetupId);
        msg.setUserId(senderId);
        msg.setContent(content.trim());
        msg.setSentAt(LocalDateTime.now());

        MeetupMessage saved = meetupMessageRepository.save(msg);
        saved.setUser(userOpt.get());

        // Difundir el mensaje a todos los subscritos en la sala de la quedada
        Set<WebSocketSession> sessions = meetupRooms.get(meetupId);
        if (sessions != null && !sessions.isEmpty()) {
            Map<String, Object> event = new HashMap<>();
            event.put("type", "MEETUP_MSG_RECEIVED");
            event.put("meetupId", meetupId);
            event.put("message", saved);

            for (WebSocketSession s : sessions) {
                if (s.isOpen()) {
                    sendJsonMessage(s, event);
                }
            }
        }
    }

    // --- UTILITIES ---

    private void sendJsonMessage(WebSocketSession session, Map<String, Object> data) {
        try {
            String json = mapper.writeValueAsString(data);
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException e) {
            System.err.println("Error enviando mensaje JSON: " + e.getMessage());
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

    @org.springframework.context.event.EventListener
    public void handleFriendshipEvent(com.mus.backend.event.FriendshipEvent event) {
        WebSocketSession session = userSessions.get(event.getUserId());
        if (session != null && session.isOpen()) {
            sendJsonMessage(session, event.getData());
        }
    }
}
