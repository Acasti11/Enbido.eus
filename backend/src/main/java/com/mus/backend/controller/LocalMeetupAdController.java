package com.mus.backend.controller;

import com.mus.backend.model.LocalMeetupAd;
import com.mus.backend.model.MeetupParticipant;
import com.mus.backend.model.MeetupMessage;
import com.mus.backend.repository.LocalMeetupAdRepository;
import com.mus.backend.repository.MeetupParticipantRepository;
import com.mus.backend.repository.MeetupMessageRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetups")
@CrossOrigin(origins = "*")
public class LocalMeetupAdController {

    @Autowired
    private LocalMeetupAdRepository meetupRepository;

    @Autowired
    private MeetupParticipantRepository participantRepository;

    @Autowired
    private MeetupMessageRepository messageRepository;

    @GetMapping
    public ResponseEntity<List<LocalMeetupAd>> getAllMeetups() {
        return ResponseEntity.ok(meetupRepository.findActiveAndNotExpired(java.time.LocalDateTime.now()));
    }

    @PostMapping
    public ResponseEntity<?> createMeetup(@RequestBody LocalMeetupAd ad, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("No autorizado: token inválido o ausente");
        }
        ad.setCreatorId(userId);
        ad.setIsActive(true);
        LocalMeetupAd saved = meetupRepository.save(ad);
        return ResponseEntity.ok(saved);
    }

    // ============================================
    // OBTENER PARTICIPANTES DE UN ANUNCIO
    // ============================================
    @GetMapping("/{adId}/participants")
    public ResponseEntity<?> getParticipants(@PathVariable Long adId) {
        return ResponseEntity.ok(participantRepository.findByAdId(adId));
    }

    // ============================================
    // UNIRSE A UN ANUNCIO (Resta 1 a missingPlayers)
    // ============================================
    @PostMapping("/{adId}/join")
    public ResponseEntity<?> joinMeetup(@PathVariable Long adId, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("No autorizado: token inválido o ausente");
        }

        LocalMeetupAd ad = meetupRepository.findById(adId).orElse(null);
        if (ad == null) {
            return ResponseEntity.notFound().build();
        }

        if (ad.getCreatorId().equals(userId)) {
            return ResponseEntity.badRequest().body("Eres el creador de este anuncio");
        }

        if (participantRepository.findByAdIdAndUserId(adId, userId).isPresent()) {
            return ResponseEntity.badRequest().body("Ya te has unido a este anuncio");
        }

        if (ad.getMissingPlayers() <= 0) {
            return ResponseEntity.badRequest().body("Esta mesa ya está completa");
        }

        // Registrar al participante
        MeetupParticipant participant = new MeetupParticipant();
        participant.setAdId(adId);
        participant.setUserId(userId);
        participantRepository.save(participant);

        // Disminuir contador de jugadores faltantes
        ad.setMissingPlayers(ad.getMissingPlayers() - 1);
        LocalMeetupAd updated = meetupRepository.save(ad);

        return ResponseEntity.ok(updated);
    }

    // ============================================
    // ABANDONAR UN ANUNCIO (Suma 1 a missingPlayers y elimina el participante)
    // ============================================
    @PostMapping("/{adId}/leave")
    public ResponseEntity<?> leaveMeetup(@PathVariable Long adId, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("No autorizado: token inválido o ausente");
        }

        LocalMeetupAd ad = meetupRepository.findById(adId).orElse(null);
        if (ad == null) {
            return ResponseEntity.notFound().build();
        }

        if (ad.getCreatorId().equals(userId)) {
            return ResponseEntity.badRequest().body("No puedes abandonar un anuncio que has creado");
        }

        java.util.Optional<MeetupParticipant> participantOpt = participantRepository.findByAdIdAndUserId(adId, userId);
        if (participantOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("No estás inscrito en este anuncio");
        }

        // Eliminar al participante
        participantRepository.delete(participantOpt.get());

        // Aumentar contador de jugadores faltantes
        ad.setMissingPlayers(ad.getMissingPlayers() + 1);
        LocalMeetupAd updated = meetupRepository.save(ad);

        return ResponseEntity.ok(updated);
    }

    // ============================================
    // OBTENER MENSAJES DE CHAT DE UN ANUNCIO
    // ============================================
    @GetMapping("/{adId}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long adId) {
        return ResponseEntity.ok(messageRepository.findByAdIdOrderBySentAtAsc(adId));
    }

    // ============================================
    // ENVIAR MENSAJE DE CHAT A UN ANUNCIO
    // ============================================
    @PostMapping("/{adId}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable Long adId, @RequestBody MeetupMessage msg, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("No autorizado: token inválido o ausente");
        }

        msg.setAdId(adId);
        msg.setUserId(userId);
        msg.setSentAt(java.time.LocalDateTime.now());
        MeetupMessage saved = messageRepository.save(msg);
        return ResponseEntity.ok(saved);
    }

    // ============================================
    // CANCELAR / ELIMINAR ANUNCIO (Por el creador)
    // ============================================
    @DeleteMapping("/{adId}")
    public ResponseEntity<?> deleteMeetup(@PathVariable Long adId, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("No autorizado: token inválido o ausente");
        }

        LocalMeetupAd ad = meetupRepository.findById(adId).orElse(null);
        if (ad == null) {
            return ResponseEntity.notFound().build();
        }

        if (!ad.getCreatorId().equals(userId)) {
            return ResponseEntity.status(403).body("No tienes permisos para eliminar este anuncio");
        }

        ad.setIsActive(false);
        meetupRepository.save(ad);
        return ResponseEntity.ok().build();
    }
}
