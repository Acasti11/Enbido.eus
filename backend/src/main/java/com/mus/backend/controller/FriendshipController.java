package com.mus.backend.controller;

import com.mus.backend.model.Friendship;
import com.mus.backend.model.Usuario;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.repository.FriendshipRepository;
import com.mus.backend.repository.UsuarioRepository;
import com.mus.backend.service.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/friendships")
@CrossOrigin(origins = "*")
public class FriendshipController {

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private UserProfileService userProfileService;

    // Registry of user presence: userId -> lastActiveTimestamp in milliseconds
    private static final Map<Long, Long> activeSessions = new ConcurrentHashMap<>();

    private void updateSessionActivity(Long userId) {
        if (userId != null) {
            activeSessions.put(userId, System.currentTimeMillis());
        }
    }

    // Response Dto inside Controller for simplicity
    public static class FriendResponse {
        public Long friendshipId;
        public Long id;
        public String username;
        public int elo;
        public int totalGamesPlayed;
        public int totalGamesWon;
        public String status;
    }

    public static class PendingRequestResponse {
        public Long friendshipId;
        public String username;
        public String type; // "received" or "sent"
    }

    @GetMapping
    public ResponseEntity<?> getFriends(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
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

        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRequests(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
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

        return ResponseEntity.ok(response);
    }

    @PostMapping("/request/{username}")
    public ResponseEntity<?> sendFriendRequest(@PathVariable String username, HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        
        Optional<Usuario> targetOpt = usuarioRepository.findByUsername(username);
        if (targetOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
        }
        
        Usuario targetUser = targetOpt.get();
        if (targetUser.getUserId().equals(currentUserId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "No puedes agregarte a ti mismo"));
        }
        
        Optional<Friendship> existingOpt = friendshipRepository.findByUserId1AndUserId2OrUserId2AndUserId1(currentUserId, targetUser.getUserId(), currentUserId, targetUser.getUserId());
        if (existingOpt.isPresent()) {
            Friendship existing = existingOpt.get();
            if (existing.getStatus().equals("accepted")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ya eres amigo de este usuario"));
            } else if (existing.getStatus().equals("pending")) {
                if (existing.getUserId1().equals(currentUserId)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Solicitud ya enviada y pendiente"));
                } else {
                    // Auto-accept request if other user already sent it to us
                    existing.setStatus("accepted");
                    friendshipRepository.save(existing);
                    return ResponseEntity.ok(Map.of("message", "Solicitud de amistad aceptada automáticamente"));
                }
            }
        }
        
        Friendship newFriendship = new Friendship();
        newFriendship.setUserId1(currentUserId);
        newFriendship.setUserId2(targetUser.getUserId());
        newFriendship.setStatus("pending");
        
        friendshipRepository.save(newFriendship);
        return ResponseEntity.ok(Map.of("message", "Solicitud de amistad enviada con éxito"));
    }

    @PostMapping("/accept/{friendshipId}")
    public ResponseEntity<?> acceptFriendRequest(@PathVariable Long friendshipId, HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        
        Optional<Friendship> fOpt = friendshipRepository.findById(friendshipId);
        if (fOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Solicitud no encontrada"));
        }
        
        Friendship f = fOpt.get();
        if (!f.getUserId2().equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "No puedes aceptar una solicitud destinada a otro usuario"));
        }
        
        f.setStatus("accepted");
        friendshipRepository.save(f);
        return ResponseEntity.ok(Map.of("message", "Solicitud de amistad aceptada"));
    }

    @PostMapping("/decline/{friendshipId}")
    public ResponseEntity<?> declineFriendRequest(@PathVariable Long friendshipId, HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        
        Optional<Friendship> fOpt = friendshipRepository.findById(friendshipId);
        if (fOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Solicitud no encontrada"));
        }
        
        Friendship f = fOpt.get();
        if (!f.getUserId2().equals(currentUserId) && !f.getUserId1().equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "No autorizado"));
        }
        
        friendshipRepository.delete(f);
        return ResponseEntity.ok(Map.of("message", "Solicitud rechazada/cancelada con éxito"));
    }

    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<?> deleteFriend(@PathVariable Long friendshipId, HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        
        Optional<Friendship> fOpt = friendshipRepository.findById(friendshipId);
        if (fOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Amistad no encontrada"));
        }
        
        Friendship f = fOpt.get();
        if (!f.getUserId1().equals(currentUserId) && !f.getUserId2().equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "No autorizado"));
        }
        
        friendshipRepository.delete(f);
        return ResponseEntity.ok(Map.of("message", "Amigo eliminado de tu lista"));
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("No autenticado");
        }
        return userId;
    }
}
