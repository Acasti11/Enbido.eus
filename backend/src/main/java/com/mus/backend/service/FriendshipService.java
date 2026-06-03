package com.mus.backend.service;

import com.mus.backend.dto.UserLeaderboardDto;
import com.mus.backend.model.Friendship;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.model.Usuario;
import com.mus.backend.repository.FriendshipRepository;
import com.mus.backend.repository.UsuarioRepository;
import com.mus.backend.controller.FriendshipController.FriendResponse;
import com.mus.backend.controller.FriendshipController.PendingRequestResponse;
import org.springframework.beans.factory.annotation.Autowired;
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
    private UsuarioRepository usuarioRepository;

    @Autowired
    private UserProfileService userProfileService;

    // Registry of user presence: userId -> lastActiveTimestamp in milliseconds
    private static final Map<Long, Long> activeSessions = new ConcurrentHashMap<>();

    public static void updateSessionActivity(Long userId) {
        if (userId != null) {
            activeSessions.put(userId, System.currentTimeMillis());
        }
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
            
            Usuario friendUser = f.getUserId1().equals(userId) ? f.getUser2() : f.getUser1();
            if (friendUser != null) {
                res.username = friendUser.getUsername();
            } else {
                res.username = usuarioRepository.findById(friendId)
                        .map(Usuario::getUsername).orElse("Usuario");
            }
            
            UserGameProfile gp = userProfileService.getOrCreateUserProfile(friendId);
            res.elo = gp.getElo() != null ? gp.getElo() : 200;
            res.totalGamesPlayed = gp.getTotalGamesPlayed() != null ? gp.getTotalGamesPlayed() : 0;
            res.totalGamesWon = gp.getTotalGamesWon() != null ? gp.getTotalGamesWon() : 0;
            
            // Check real-time presence (active in the last 20 seconds)
            long lastActive = activeSessions.getOrDefault(friendId, 0L);
            res.status = (System.currentTimeMillis() - lastActive) < 20000 ? "online" : "offline";
            
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
            Usuario sender = f.getUser1();
            res.username = sender != null ? sender.getUsername() : "Usuario";
            res.type = "received";
            response.add(res);
        }

        for (Friendship f : sent) {
            PendingRequestResponse res = new PendingRequestResponse();
            res.friendshipId = f.getFriendshipId();
            Usuario receiver = f.getUser2();
            res.username = receiver != null ? receiver.getUsername() : "Usuario";
            res.type = "sent";
            response.add(res);
        }

        return response;
    }

    @Transactional
    public Map<String, String> sendFriendRequest(Long currentUserId, String targetUsername) {
        Optional<Usuario> targetOpt = usuarioRepository.findByUsername(targetUsername);
        if (targetOpt.isEmpty()) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        
        Usuario targetUser = targetOpt.get();
        if (targetUser.getUserId().equals(currentUserId)) {
            throw new IllegalArgumentException("No puedes agregarte a ti mismo");
        }
        
        Optional<Friendship> existingOpt = friendshipRepository.findByUserId1AndUserId2OrUserId2AndUserId1(currentUserId, targetUser.getUserId(), currentUserId, targetUser.getUserId());
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
                    return Map.of("message", "Solicitud de amistad aceptada automáticamente");
                }
            }
        }
        
        Friendship newFriendship = new Friendship();
        newFriendship.setUserId1(currentUserId);
        newFriendship.setUserId2(targetUser.getUserId());
        newFriendship.setStatus("pending");
        
        friendshipRepository.save(newFriendship);
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
        friendshipRepository.save(f);
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
        
        friendshipRepository.delete(f);
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
        
        friendshipRepository.delete(f);
    }
}
