package com.mus.backend.controller;

import com.mus.backend.service.FriendshipService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friendships")
@CrossOrigin(origins = "*")
public class FriendshipController {

    @Autowired
    private FriendshipService friendshipService;

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
        List<FriendResponse> response = friendshipService.getFriends(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRequests(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        List<PendingRequestResponse> response = friendshipService.getPendingRequests(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/request/{username}")
    public ResponseEntity<?> sendFriendRequest(@PathVariable String username, HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        try {
            Map<String, String> response = friendshipService.sendFriendRequest(currentUserId, username);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            String errorMsg = e.getMessage();
            if (errorMsg.contains("no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", errorMsg));
            }
            return ResponseEntity.badRequest().body(Map.of("error", errorMsg));
        }
    }

    @PostMapping("/accept/{friendshipId}")
    public ResponseEntity<?> acceptFriendRequest(@PathVariable Long friendshipId, HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        try {
            friendshipService.acceptFriendRequest(friendshipId, currentUserId);
            return ResponseEntity.ok(Map.of("message", "Solicitud de amistad aceptada"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/decline/{friendshipId}")
    public ResponseEntity<?> declineFriendRequest(@PathVariable Long friendshipId, HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        try {
            friendshipService.declineFriendRequest(friendshipId, currentUserId);
            return ResponseEntity.ok(Map.of("message", "Solicitud de amistad rechazada/cancelada con éxito"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<?> deleteFriend(@PathVariable Long friendshipId, HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        try {
            friendshipService.deleteFriend(friendshipId, currentUserId);
            return ResponseEntity.ok(Map.of("message", "Amigo eliminado de tu lista"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("No autenticado");
        }
        return userId;
    }
}
