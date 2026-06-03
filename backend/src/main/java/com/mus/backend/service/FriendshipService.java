package com.mus.backend.service;

import com.mus.backend.dto.UserLeaderboardDto;
import com.mus.backend.model.Friendship;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.model.User;
import com.mus.backend.repository.FriendshipRepository;
import com.mus.backend.repository.UserRepository;
import com.mus.backend.controller.FriendshipController.FriendResponse;
import com.mus.backend.controller.FriendshipController.PendingRequestResponse;
import com.mus.backend.event.FriendshipEvent;
import com.mus.backend.controller.ChatWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FriendshipService {

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileService userProfileService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    // Registry of user activity: userId -> lastActiveTimestamp in milliseconds
    private static final Map<Long, Long> activeSessions = new ConcurrentHashMap<>();

    public static void updateSessionActivity(Long userId) {
        if (userId != null) {
            activeSessions.put(userId, System.currentTimeMillis());
        }
    }

    @Transactional(readOnly = true)
    public boolean isBlocked(Long blockerId, Long blockedId) {
        return friendshipRepository.findRelation(blockerId, blockedId)
                .map(f -> "blocked".equals(f.getStatus()) && f.getUserId1().equals(blockerId))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean hasBlockRelationship(Long userId1, Long userId2) {
        return friendshipRepository.findRelation(userId1, userId2)
                .map(f -> "blocked".equals(f.getStatus()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> getFriends(Long userId) {
        List<Friendship> friendships = friendshipRepository.findByUserId1AndStatusOrUserId2AndStatus(userId, "accepted", userId, "accepted");
        List<FriendResponse> response = new ArrayList<>();

        for (Friendship f : friendships) {
            FriendResponse res = new FriendResponse();
            res.friendshipId = f.getFriendshipId();
            
            // Determine who is the friend
            Long friendId = f.getUserId1().equals(userId) ? f.getUserId2() : f.getUserId1();
            res.id = friendId;
            
            User friendUser = f.getUserId1().equals(userId) ? f.getUser2() : f.getUser1();
            if (friendUser != null) {
                res.username = friendUser.getUsername();
            } else {
                res.username = userRepository.findById(friendId)
                        .map(User::getUsername).orElse("Usuario");
            }
            
            UserGameProfile gp = userProfileService.getOrCreateUserProfile(friendId);
            res.elo = gp.getElo() != null ? gp.getElo() : 200;
            res.totalGamesPlayed = gp.getTotalGamesPlayed() != null ? gp.getTotalGamesPlayed() : 0;
            res.totalGamesWon = gp.getTotalGamesWon() != null ? gp.getTotalGamesWon() : 0;
            
            // Check real-time presence (active in the last 20 seconds, or has active Chat WebSocket connection)
            long lastActive = activeSessions.getOrDefault(friendId, 0L);
            boolean isOnline = (System.currentTimeMillis() - lastActive) < 20000 || ChatWebSocketHandler.isUserOnline(friendId);
            res.status = isOnline ? "online" : "offline";
            
            response.add(res);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<PendingRequestResponse> getPendingRequests(Long userId) {
        List<Friendship> received = friendshipRepository.findByUserId2AndStatus(userId, "pending");
        List<Friendship> sent = friendshipRepository.findByUserId1AndStatus(userId, "pending");
        List<PendingRequestResponse> response = new ArrayList<>();

        for (Friendship f : received) {
            PendingRequestResponse res = new PendingRequestResponse();
            res.friendshipId = f.getFriendshipId();
            User sender = f.getUser1();
            res.username = sender != null ? sender.getUsername() : "Usuario";
            res.type = "received";
            response.add(res);
        }

        for (Friendship f : sent) {
            PendingRequestResponse res = new PendingRequestResponse();
            res.friendshipId = f.getFriendshipId();
            User receiver = f.getUser2();
            res.username = receiver != null ? receiver.getUsername() : "Usuario";
            res.type = "sent";
            response.add(res);
        }

        return response;
    }

    @Transactional
    public Map<String, String> sendFriendRequest(Long currentUserId, String targetUsername) {
        Optional<User> targetOpt = userRepository.findByUsername(targetUsername);
        if (targetOpt.isEmpty()) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        
        User targetUser = targetOpt.get();
        if (targetUser.getUserId().equals(currentUserId)) {
            throw new IllegalArgumentException("No puedes agregarte a ti mismo");
        }

        // Check if blocked
        if (hasBlockRelationship(currentUserId, targetUser.getUserId())) {
            if (isBlocked(currentUserId, targetUser.getUserId())) {
                throw new IllegalArgumentException("Has bloqueado a este usuario. Desbloquéalo primero.");
            } else {
                throw new IllegalArgumentException("No se puede enviar la solicitud de amistad.");
            }
        }
        
        Optional<Friendship> existingOpt = friendshipRepository.findRelation(currentUserId, targetUser.getUserId());
        if (existingOpt.isPresent()) {
            Friendship existing = existingOpt.get();
            if (existing.getStatus().equals("accepted")) {
                throw new IllegalArgumentException("Ya eres amigo de este usuario");
            } else if (existing.getStatus().equals("pending")) {
                if (existing.getUserId1().equals(currentUserId)) {
                    throw new IllegalArgumentException("Solicitud ya enviada y pendiente");
                } else {
                    // Auto-accept request if other user already sent it to us
                    existing.setStatus("accepted");
                    friendshipRepository.save(existing);

                    User currentUser = userRepository.findById(currentUserId).orElse(null);
                    String currentUsername = currentUser != null ? currentUser.getUsername() : "Usuario";

                    // Notify original sender
                    eventPublisher.publishEvent(new FriendshipEvent(this, targetUser.getUserId(), Map.of(
                        "type", "FRIEND_REQUEST_ACCEPTED",
                        "friendshipId", existing.getFriendshipId(),
                        "friendId", currentUserId,
                        "username", currentUsername
                    )));

                    return Map.of("message", "Solicitud de amistad aceptada automáticamente");
                }
            }
        }
        
        Friendship newFriendship = new Friendship();
        newFriendship.setUserId1(currentUserId);
        newFriendship.setUserId2(targetUser.getUserId());
        newFriendship.setStatus("pending");
        
        Friendship saved = friendshipRepository.save(newFriendship);

        // Notify target user of received request
        User currentUser = userRepository.findById(currentUserId).orElse(null);
        String currentUsername = currentUser != null ? currentUser.getUsername() : "Usuario";
        eventPublisher.publishEvent(new FriendshipEvent(this, targetUser.getUserId(), Map.of(
            "type", "FRIEND_REQUEST_RECEIVED",
            "friendshipId", saved.getFriendshipId(),
            "senderId", currentUserId,
            "username", currentUsername
        )));

        return Map.of("message", "Solicitud de amistad enviada con éxito");
    }

    @Transactional
    public void acceptFriendRequest(Long friendshipId, Long currentUserId) {
        Optional<Friendship> fOpt = friendshipRepository.findById(friendshipId);
        if (fOpt.isEmpty()) {
            throw new IllegalArgumentException("Solicitud no encontrada");
        }
        
        Friendship f = fOpt.get();
        if (!f.getUserId2().equals(currentUserId)) {
            throw new SecurityException("No puedes aceptar una solicitud destinada a otro usuario");
        }
        
        f.setStatus("accepted");
        Friendship saved = friendshipRepository.save(f);

        // Notify both users in real-time
        Long friendId = saved.getUserId1();
        User currentUser = saved.getUser2();
        if (currentUser == null) {
            currentUser = userRepository.findById(currentUserId).orElse(null);
        }
        User friendUser = saved.getUser1();
        if (friendUser == null) {
            friendUser = userRepository.findById(friendId).orElse(null);
        }
        String currentUsername = currentUser != null ? currentUser.getUsername() : "Usuario";
        String friendUsername = friendUser != null ? friendUser.getUsername() : "Usuario";

        // Notify the original sender
        eventPublisher.publishEvent(new FriendshipEvent(this, friendId, Map.of(
            "type", "FRIEND_REQUEST_ACCEPTED",
            "friendshipId", friendshipId,
            "friendId", currentUserId,
            "username", currentUsername
        )));

        // Notify the acceptor
        eventPublisher.publishEvent(new FriendshipEvent(this, currentUserId, Map.of(
            "type", "FRIEND_REQUEST_ACCEPTED",
            "friendshipId", friendshipId,
            "friendId", friendId,
            "username", friendUsername
        )));
    }

    @Transactional
    public void declineFriendRequest(Long friendshipId, Long currentUserId) {
        Optional<Friendship> fOpt = friendshipRepository.findById(friendshipId);
        if (fOpt.isEmpty()) {
            throw new IllegalArgumentException("Solicitud no encontrada");
        }
        
        Friendship f = fOpt.get();
        if (!f.getUserId2().equals(currentUserId) && !f.getUserId1().equals(currentUserId)) {
            throw new SecurityException("No autorizado");
        }
        
        Long otherUserId = f.getUserId1().equals(currentUserId) ? f.getUserId2() : f.getUserId1();
        friendshipRepository.delete(f);

        // Notify both users
        eventPublisher.publishEvent(new FriendshipEvent(this, otherUserId, Map.of(
            "type", "FRIEND_DELETED",
            "friendshipId", friendshipId,
            "friendId", currentUserId
        )));
        eventPublisher.publishEvent(new FriendshipEvent(this, currentUserId, Map.of(
            "type", "FRIEND_DELETED",
            "friendshipId", friendshipId,
            "friendId", otherUserId
        )));
    }

    @Transactional
    public void deleteFriend(Long friendshipId, Long currentUserId) {
        Optional<Friendship> fOpt = friendshipRepository.findById(friendshipId);
        if (fOpt.isEmpty()) {
            throw new IllegalArgumentException("Amistad no encontrada");
        }
        
        Friendship f = fOpt.get();
        if (!f.getUserId1().equals(currentUserId) && !f.getUserId2().equals(currentUserId)) {
            throw new SecurityException("No autorizado");
        }
        
        Long otherUserId = f.getUserId1().equals(currentUserId) ? f.getUserId2() : f.getUserId1();
        friendshipRepository.delete(f);

        // Notify both users
        eventPublisher.publishEvent(new FriendshipEvent(this, otherUserId, Map.of(
            "type", "FRIEND_DELETED",
            "friendshipId", friendshipId,
            "friendId", currentUserId
        )));
        eventPublisher.publishEvent(new FriendshipEvent(this, currentUserId, Map.of(
            "type", "FRIEND_DELETED",
            "friendshipId", friendshipId,
            "friendId", otherUserId
        )));
    }

    @Transactional
    public void blockUser(Long currentUserId, Long targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("No puedes bloquearte a ti mismo");
        }
        if (!userRepository.existsById(targetUserId)) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }

        Optional<Friendship> fOpt = friendshipRepository.findRelation(currentUserId, targetUserId);
        Friendship f = fOpt.orElseGet(Friendship::new);
        
        f.setUserId1(currentUserId); // Blocker is always userId1
        f.setUserId2(targetUserId); // Blocked is always userId2
        f.setStatus("blocked");
        
        friendshipRepository.save(f);

        // Notify both users to refresh lists and close DMs
        eventPublisher.publishEvent(new FriendshipEvent(this, currentUserId, Map.of(
            "type", "FRIEND_BLOCKED",
            "friendId", targetUserId,
            "blockerId", currentUserId
        )));
        eventPublisher.publishEvent(new FriendshipEvent(this, targetUserId, Map.of(
            "type", "FRIEND_BLOCKED",
            "friendId", currentUserId,
            "blockerId", currentUserId
        )));
    }

    @Transactional
    public void unblockUser(Long currentUserId, Long targetUserId) {
        Optional<Friendship> fOpt = friendshipRepository.findRelation(currentUserId, targetUserId);
        if (fOpt.isEmpty()) {
            throw new IllegalArgumentException("Relación no encontrada");
        }

        Friendship f = fOpt.get();
        if (!"blocked".equals(f.getStatus())) {
            throw new IllegalArgumentException("El usuario no está bloqueado");
        }
        if (!f.getUserId1().equals(currentUserId)) {
            throw new SecurityException("No estás autorizado para desbloquear a este usuario");
        }

        friendshipRepository.delete(f);

        // Notify both users to update lists
        eventPublisher.publishEvent(new FriendshipEvent(this, currentUserId, Map.of(
            "type", "FRIEND_UNBLOCKED",
            "friendId", targetUserId,
            "blockerId", currentUserId
        )));
        eventPublisher.publishEvent(new FriendshipEvent(this, targetUserId, Map.of(
            "type", "FRIEND_UNBLOCKED",
            "friendId", currentUserId,
            "blockerId", currentUserId
        )));
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> getBlockedUsers(Long currentUserId) {
        List<Friendship> blockedRelations = friendshipRepository.findByUserId1AndStatus(currentUserId, "blocked");
        List<FriendResponse> response = new ArrayList<>();

        for (Friendship f : blockedRelations) {
            FriendResponse res = new FriendResponse();
            res.friendshipId = f.getFriendshipId();
            res.id = f.getUserId2();
            
            User blockedUser = f.getUser2();
            if (blockedUser != null) {
                res.username = blockedUser.getUsername();
            } else {
                res.username = userRepository.findById(f.getUserId2())
                        .map(User::getUsername).orElse("Usuario");
            }
            res.status = "offline";
            response.add(res);
        }
        return response;
    }
}
