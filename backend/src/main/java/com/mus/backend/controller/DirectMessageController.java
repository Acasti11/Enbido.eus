package com.mus.backend.controller;

import com.mus.backend.model.DirectMessage;
import com.mus.backend.model.Usuario;
import com.mus.backend.repository.DirectMessageRepository;
import com.mus.backend.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class DirectMessageController {

    @Autowired
    private DirectMessageRepository directMessageRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Request DTO for sending message
    public static class MessageRequest {
        public String content;
    }

    @GetMapping("/{friendId}")
    public ResponseEntity<?> getChatHistory(@PathVariable Long friendId, HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        
        // Verify receiver exists
        if (!usuarioRepository.existsById(friendId)) {
            return ResponseEntity.status(404).body(Map.of("error", "Usuario amigo no encontrado"));
        }
        
        List<DirectMessage> history = directMessageRepository.findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderBySentAtAsc(currentUserId, friendId, friendId, currentUserId);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/{friendId}")
    public ResponseEntity<?> sendDirectMessage(
            @PathVariable Long friendId, 
            @RequestBody MessageRequest body, 
            HttpServletRequest request) {
        
        Long currentUserId = getCurrentUserId(request);
        
        if (body.content == null || body.content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El contenido del mensaje no puede estar vacío"));
        }

        // Verify receiver exists
        Optional<Usuario> receiverOpt = usuarioRepository.findById(friendId);
        if (receiverOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Usuario receptor no encontrado"));
        }

        DirectMessage dm = new DirectMessage();
        dm.setSenderId(currentUserId);
        dm.setReceiverId(friendId);
        dm.setContent(body.content.trim());
        
        DirectMessage saved = directMessageRepository.save(dm);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/received")
    public ResponseEntity<?> getReceivedMessages(HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        List<DirectMessage> messages = directMessageRepository.findByReceiverIdOrderBySentAtDesc(currentUserId);
        return ResponseEntity.ok(messages);
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("No autenticado");
        }
        return userId;
    }
}
