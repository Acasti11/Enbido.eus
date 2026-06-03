package com.mus.backend.controller;

import com.mus.backend.dto.TournamentDetailDto;
import com.mus.backend.model.PhysicalTournament;
import com.mus.backend.model.PhysicalTournamentMatch;
import com.mus.backend.model.PhysicalTournamentParticipant;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.repository.PhysicalTournamentMatchRepository;
import com.mus.backend.repository.PhysicalTournamentParticipantRepository;
import com.mus.backend.repository.PhysicalTournamentRepository;
import com.mus.backend.repository.UserGameProfileRepository;
import com.mus.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tournaments")
@CrossOrigin(origins = "*")
public class PhysicalTournamentController {

    @Autowired
    private PhysicalTournamentRepository tournamentRepository;

    @Autowired
    private PhysicalTournamentParticipantRepository participantRepository;

    @Autowired
    private PhysicalTournamentMatchRepository matchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserGameProfileRepository profileRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<PhysicalTournament>> getAllTournaments() {
        return ResponseEntity.ok(tournamentRepository.findAll());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createTournament(@RequestBody PhysicalTournament tournament, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body("No autorizado: token inválido o ausente");
        }
        tournament.setOrganizerId(userId);
        tournament.setStatus("open");
        PhysicalTournament saved = tournamentRepository.save(tournament);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}/details")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getTournamentDetails(@PathVariable Long id) {
        PhysicalTournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.notFound().build();
        }

        // Get participants list
        List<PhysicalTournamentParticipant> parts = participantRepository.findByTournamentId(id);
        List<TournamentDetailDto.ParticipantInfo> partInfos = new ArrayList<>();
        for (PhysicalTournamentParticipant p : parts) {
            String uname = userRepository.findById(p.getUserId())
                    .map(com.mus.backend.model.User::getUsername)
                    .orElse("Usuario-" + p.getUserId());
            partInfos.add(new TournamentDetailDto.ParticipantInfo(p.getUserId(), uname));
        }

        // Get generated matches list
        List<PhysicalTournamentMatch> matches = matchRepository.findByTournamentId(id);

        TournamentDetailDto dto = new TournamentDetailDto(
                tournament, partInfos, matches
        );
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/join")
    @Transactional
    public ResponseEntity<?> joinTournament(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body("No autorizado: token inválido o ausente");
        }

        PhysicalTournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body("Torneo no encontrado");
        }

        if (!"open".equalsIgnoreCase(tournament.getStatus())) {
            return ResponseEntity.badRequest().body("Las inscripciones para este torneo están cerradas.");
        }

        // Check if already registered
        if (participantRepository.existsByTournamentIdAndUserId(id, userId)) {
            return ResponseEntity.badRequest().body("Ya estás inscrito en este torneo");
        }

        // Check capacity
        long currentCount = participantRepository.countByTournamentId(id);
        if (tournament.getMaxTeams() != null && currentCount >= tournament.getMaxTeams()) {
            return ResponseEntity.badRequest().body("El torneo ha alcanzado su capacidad máxima.");
        }

        // Deduct entry fee
        int fee = tournament.getCoinsFee() != null ? tournament.getCoinsFee() : 0;
        if (fee > 0) {
            UserGameProfile profile = profileRepository.findById(userId)
                    .orElseGet(() -> new UserGameProfile(userId));
            int userCoins = profile.getCoins() != null ? profile.getCoins() : 0;
            if (userCoins < fee) {
                return ResponseEntity.badRequest().body("No tienes suficientes monedas (tx) para inscribirte. Requieres " + fee + " tx");
            }
            profile.setCoins(userCoins - fee);
            profileRepository.save(profile);
        }

        // Save participant registration
        PhysicalTournamentParticipant p = new PhysicalTournamentParticipant(id, userId, java.time.LocalDateTime.now());
        participantRepository.save(p);

        return ResponseEntity.ok(Map.of("message", "Inscrito con éxito", "coinsFee", fee));
    }

    @PostMapping("/{id}/start")
    @Transactional
    public ResponseEntity<?> startTournament(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        PhysicalTournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.notFound().build();
        }

        if (!tournament.getOrganizerId().equals(userId)) {
            return ResponseEntity.status(403).body("Solo el organizador puede iniciar el torneo.");
        }

        if (!"open".equalsIgnoreCase(tournament.getStatus())) {
            return ResponseEntity.badRequest().body("El torneo ya ha sido iniciado o finalizado.");
        }

        List<PhysicalTournamentParticipant> parts = participantRepository.findByTournamentId(id);
        if (parts.size() < 2) {
            return ResponseEntity.badRequest().body("Se requieren al menos 2 participantes para iniciar el torneo.");
        }

        // Shuffle participants for random bracket seeds
        Collections.shuffle(parts);

        // Round 1 (Quarterfinals if > 4, else Semifinals)
        int startingRound = parts.size() > 4 ? 1 : 2;

        // Clear existing matches if any
        List<PhysicalTournamentMatch> existing = matchRepository.findByTournamentId(id);
        if (!existing.isEmpty()) {
            matchRepository.deleteAll(existing);
        }

        if (startingRound == 1) {
            // Pre-create Round 1 Quarterfinals (4 matches)
            for (int i = 0; i < 4; i++) {
                Long p1 = (i * 2 < parts.size()) ? parts.get(i * 2).getUserId() : null;
                Long p2 = (i * 2 + 1 < parts.size()) ? parts.get(i * 2 + 1).getUserId() : null;

                PhysicalTournamentMatch match = new PhysicalTournamentMatch();
                match.setTournamentId(id);
                match.setRoundNumber(1);
                match.setMatchIndex(i);
                match.setPlayer1Id(p1);
                match.setPlayer2Id(p2);
                matchRepository.save(match);
            }
            // Pre-create Round 2 Semifinals (2 matches)
            for (int i = 0; i < 2; i++) {
                PhysicalTournamentMatch match = new PhysicalTournamentMatch();
                match.setTournamentId(id);
                match.setRoundNumber(2);
                match.setMatchIndex(i);
                matchRepository.save(match);
            }
            // Pre-create Round 3 Final (1 match)
            PhysicalTournamentMatch match = new PhysicalTournamentMatch();
            match.setTournamentId(id);
            match.setRoundNumber(3);
            match.setMatchIndex(0);
            matchRepository.save(match);

        } else {
            // Pre-create Round 2 Semifinals (2 matches)
            for (int i = 0; i < 2; i++) {
                Long p1 = (i * 2 < parts.size()) ? parts.get(i * 2).getUserId() : null;
                Long p2 = (i * 2 + 1 < parts.size()) ? parts.get(i * 2 + 1).getUserId() : null;

                PhysicalTournamentMatch match = new PhysicalTournamentMatch();
                match.setTournamentId(id);
                match.setRoundNumber(2);
                match.setMatchIndex(i);
                match.setPlayer1Id(p1);
                match.setPlayer2Id(p2);
                matchRepository.save(match);
            }
            // Pre-create Round 3 Final (1 match)
            PhysicalTournamentMatch match = new PhysicalTournamentMatch();
            match.setTournamentId(id);
            match.setRoundNumber(3);
            match.setMatchIndex(0);
            matchRepository.save(match);
        }

        tournament.setStatus("playing");
        tournamentRepository.save(tournament);

        return ResponseEntity.ok(Map.of("message", "Torneo iniciado y llaves generadas con éxito"));
    }

    @PostMapping("/{id}/matches/{matchId}/report")
    @Transactional
    public ResponseEntity<?> reportMatchWinner(
            @PathVariable Long id,
            @PathVariable Long matchId,
            @RequestParam Long winnerId,
            @RequestParam String score,
            HttpServletRequest request) {

        Long userId = getCurrentUserId(request);
        PhysicalTournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.notFound().build();
        }

        if (!tournament.getOrganizerId().equals(userId)) {
            return ResponseEntity.status(403).body("Solo el organizador puede reportar resultados.");
        }

        PhysicalTournamentMatch match = matchRepository.findById(matchId).orElse(null);
        if (match == null || !match.getTournamentId().equals(id)) {
            return ResponseEntity.badRequest().body("Enfrentamiento no encontrado en este torneo");
        }

        if (match.getPlayer1Id() == null || match.getPlayer2Id() == null) {
            return ResponseEntity.badRequest().body("No se puede reportar resultado para una ronda incompleta.");
        }

        if (!winnerId.equals(match.getPlayer1Id()) && !winnerId.equals(match.getPlayer2Id())) {
            return ResponseEntity.badRequest().body("El ganador debe ser uno de los dos competidores.");
        }

        match.setWinnerId(winnerId);
        match.setScore(score);
        matchRepository.save(match);

        // Advance winner to next round index
        int currentRound = match.getRoundNumber();
        int nextRound = currentRound + 1;
        int nextIndex = match.getMatchIndex() / 2;
        boolean isPlayer1 = match.getMatchIndex() % 2 == 0;

        if (currentRound < 3) {
            PhysicalTournamentMatch nextMatch = matchRepository
                    .findByTournamentIdAndRoundNumberAndMatchIndex(id, nextRound, nextIndex);
            if (nextMatch != null) {
                if (isPlayer1) {
                    nextMatch.setPlayer1Id(winnerId);
                } else {
                    nextMatch.setPlayer2Id(winnerId);
                }
                matchRepository.save(nextMatch);
            }
        } else if (currentRound == 3) {
            // Final match is complete! Award ELO profile reward coins
            tournament.setStatus("finished");
            tournamentRepository.save(tournament);

            int prize = tournament.getCoinsReward() != null ? tournament.getCoinsReward() : 0;
            if (prize > 0) {
                UserGameProfile profile = profileRepository.findById(winnerId)
                        .orElseGet(() -> new UserGameProfile(winnerId));
                profile.setCoins((profile.getCoins() != null ? profile.getCoins() : 0) + prize);
                profileRepository.save(profile);
            }
        }

        return ResponseEntity.ok(Map.of("message", "Resultado reportado con éxito"));
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("No autenticado");
        }
        return userId;
    }
}
