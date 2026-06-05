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
import com.mus.backend.engine.GameSessionManager;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;

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

    @Autowired
    private GameSessionManager sessionManager;


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

        startTournamentInternal(tournament, parts);

        return ResponseEntity.ok(Map.of("message", "Torneo iniciado y llaves generadas con éxito"));
    }

    private void startTournamentInternal(PhysicalTournament tournament, List<PhysicalTournamentParticipant> parts) {
        Collections.shuffle(parts);
        int startingRound = parts.size() > 4 ? 1 : 2;
        Long id = tournament.getTournamentId();

        List<PhysicalTournamentMatch> existing = matchRepository.findByTournamentId(id);
        if (!existing.isEmpty()) {
            matchRepository.deleteAll(existing);
        }

        if (startingRound == 1) {
            // Quarterfinals
            for (int i = 0; i < 4; i++) {
                Long p1 = (i * 2 < parts.size()) ? parts.get(i * 2).getUserId() : null;
                Long p2 = (i * 2 + 1 < parts.size()) ? parts.get(i * 2 + 1).getUserId() : null;

                PhysicalTournamentMatch match = new PhysicalTournamentMatch();
                match.setTournamentId(id);
                match.setRoundNumber(1);
                match.setMatchIndex(i);
                match.setPlayer1Id(p1);
                match.setPlayer2Id(p2);
                match.setPlayer1Ready(false);
                match.setPlayer2Ready(false);
                match.setIsCompleted(false);
                matchRepository.save(match);
            }
            // Semifinals
            for (int i = 0; i < 2; i++) {
                PhysicalTournamentMatch match = new PhysicalTournamentMatch();
                match.setTournamentId(id);
                match.setRoundNumber(2);
                match.setMatchIndex(i);
                match.setIsCompleted(false);
                matchRepository.save(match);
            }
            // Final
            PhysicalTournamentMatch match = new PhysicalTournamentMatch();
            match.setTournamentId(id);
            match.setRoundNumber(3);
            match.setMatchIndex(0);
            match.setIsCompleted(false);
            matchRepository.save(match);
        } else {
            // Semifinals
            for (int i = 0; i < 2; i++) {
                Long p1 = (i * 2 < parts.size()) ? parts.get(i * 2).getUserId() : null;
                Long p2 = (i * 2 + 1 < parts.size()) ? parts.get(i * 2 + 1).getUserId() : null;

                PhysicalTournamentMatch match = new PhysicalTournamentMatch();
                match.setTournamentId(id);
                match.setRoundNumber(2);
                match.setMatchIndex(i);
                match.setPlayer1Id(p1);
                match.setPlayer2Id(p2);
                match.setPlayer1Ready(false);
                match.setPlayer2Ready(false);
                match.setIsCompleted(false);
                matchRepository.save(match);
            }
            // Final
            PhysicalTournamentMatch match = new PhysicalTournamentMatch();
            match.setTournamentId(id);
            match.setRoundNumber(3);
            match.setMatchIndex(0);
            match.setIsCompleted(false);
            matchRepository.save(match);
        }

        tournament.setStatus("playing");
        tournamentRepository.save(tournament);

        checkAndAdvanceRound(tournament);
    }

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void autoProcessTournaments() {
        List<PhysicalTournament> tournaments = tournamentRepository.findAll();
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        for (PhysicalTournament t : tournaments) {
            if ("open".equalsIgnoreCase(t.getStatus())) {
                if (t.getStartDatetime() != null && t.getStartDatetime().isBefore(now)) {
                    List<PhysicalTournamentParticipant> parts = participantRepository.findByTournamentId(t.getTournamentId());
                    if (parts.size() >= 2) {
                        try {
                            System.out.println("Auto-starting tournament ID: " + t.getTournamentId() + " (" + t.getTitle() + ")");
                            startTournamentInternal(t, parts);
                        } catch (Exception e) {
                            System.err.println("Error auto-starting tournament: " + e.getMessage());
                        }
                    } else {
                        t.setStatus("cancelled");
                        tournamentRepository.save(t);
                    }
                }
            } else if ("playing".equalsIgnoreCase(t.getStatus())) {
                processPlayingTournament(t);
            }
        }
    }

    private void processPlayingTournament(PhysicalTournament tournament) {
        Long tournamentId = tournament.getTournamentId();
        List<PhysicalTournamentMatch> matches = matchRepository.findByTournamentId(tournamentId);

        int activeRound = 4;
        for (PhysicalTournamentMatch m : matches) {
            if (m.getIsCompleted() == null || !m.getIsCompleted()) {
                if (m.getRoundNumber() < activeRound) {
                    activeRound = m.getRoundNumber();
                }
            }
        }

        if (activeRound == 4) {
            checkAndAdvanceRound(tournament);
            return;
        }

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        boolean stateChanged = false;

        for (PhysicalTournamentMatch m : matches) {
            if (m.getRoundNumber() == activeRound && (m.getIsCompleted() == null || !m.getIsCompleted())) {
                if (m.getPlayer1Id() != null && m.getPlayer2Id() != null) {
                    if (m.getRoundStartTime() == null) {
                        m.setRoundStartTime(now);
                        matchRepository.save(m);
                        stateChanged = true;
                    } else if (m.getGameRoomId() == null) {
                        if (m.getRoundStartTime().plusMinutes(5).isBefore(now)) {
                            boolean p1Ready = m.getPlayer1Ready() != null && m.getPlayer1Ready();
                            boolean p2Ready = m.getPlayer2Ready() != null && m.getPlayer2Ready();

                            m.setIsCompleted(true);
                            if (p1Ready && !p2Ready) {
                                m.setWinnerId(m.getPlayer1Id());
                                m.setScore("W/O");
                                advanceWinner(tournamentId, activeRound, m.getMatchIndex(), m.getPlayer1Id());
                            } else if (!p1Ready && p2Ready) {
                                m.setWinnerId(m.getPlayer2Id());
                                m.setScore("W/O");
                                advanceWinner(tournamentId, activeRound, m.getMatchIndex(), m.getPlayer2Id());
                            } else {
                                m.setWinnerId(null);
                                m.setScore("DNP");
                            }
                            matchRepository.save(m);
                            stateChanged = true;
                        }
                    }
                }
            }
        }

        if (stateChanged) {
            checkAndAdvanceRound(tournament);
        }
    }

    public void checkAndAdvanceRound(PhysicalTournament tournament) {
        Long tournamentId = tournament.getTournamentId();
        List<PhysicalTournamentMatch> matches = matchRepository.findByTournamentId(tournamentId);

        int activeRound = 4;
        for (PhysicalTournamentMatch m : matches) {
            if (m.getIsCompleted() == null || !m.getIsCompleted()) {
                if (m.getRoundNumber() < activeRound) {
                    activeRound = m.getRoundNumber();
                }
            }
        }

        if (activeRound == 4) {
            tournament.setStatus("finished");
            tournamentRepository.save(tournament);

            PhysicalTournamentMatch finalMatch = matches.stream()
                    .filter(m -> m.getRoundNumber() == 3 && m.getMatchIndex() == 0)
                    .findFirst().orElse(null);
            if (finalMatch != null && finalMatch.getWinnerId() != null && finalMatch.getWinnerId() > 0) {
                Long winnerId = finalMatch.getWinnerId();
                int prize = tournament.getCoinsReward() != null ? tournament.getCoinsReward() : 0;
                if (prize > 0) {
                    UserGameProfile profile = profileRepository.findById(winnerId)
                            .orElseGet(() -> new UserGameProfile(winnerId));
                    profile.setCoins((profile.getCoins() != null ? profile.getCoins() : 0) + prize);
                    profileRepository.save(profile);
                }
            }
            return;
        }

        boolean roundCompleted = true;
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        for (PhysicalTournamentMatch m : matches) {
            if (m.getRoundNumber() == activeRound) {
                if (m.getIsCompleted() == null || !m.getIsCompleted()) {
                    if (m.getPlayer1Id() == null && m.getPlayer2Id() == null) {
                        m.setIsCompleted(true);
                        m.setScore("DNP");
                        m.setWinnerId(null);
                        matchRepository.save(m);
                    } else if (m.getPlayer1Id() != null && m.getPlayer2Id() == null) {
                        m.setIsCompleted(true);
                        m.setWinnerId(m.getPlayer1Id());
                        m.setScore("BYE");
                        matchRepository.save(m);
                        advanceWinner(tournamentId, activeRound, m.getMatchIndex(), m.getPlayer1Id());
                    } else if (m.getPlayer1Id() == null && m.getPlayer2Id() != null) {
                        m.setIsCompleted(true);
                        m.setWinnerId(m.getPlayer2Id());
                        m.setScore("BYE");
                        matchRepository.save(m);
                        advanceWinner(tournamentId, activeRound, m.getMatchIndex(), m.getPlayer2Id());
                    } else {
                        if (m.getRoundStartTime() == null) {
                            m.setRoundStartTime(now);
                            matchRepository.save(m);
                        }
                        roundCompleted = false;
                    }
                }
            }
        }

        if (roundCompleted) {
            for (PhysicalTournamentMatch m : matches) {
                if (m.getRoundNumber() == activeRound + 1) {
                    if (m.getPlayer1Id() != null && m.getPlayer2Id() != null && m.getRoundStartTime() == null) {
                        m.setRoundStartTime(now);
                        matchRepository.save(m);
                    }
                }
            }
            checkAndAdvanceRound(tournament);
        }
    }

    private void advanceWinner(Long tournamentId, int currentRound, int matchIndex, Long winnerId) {
        int nextRound = currentRound + 1;
        int nextIndex = matchIndex / 2;
        boolean isPlayer1 = matchIndex % 2 == 0;

        if (currentRound < 3) {
            PhysicalTournamentMatch nextMatch = matchRepository
                    .findByTournamentIdAndRoundNumberAndMatchIndex(tournamentId, nextRound, nextIndex);
            if (nextMatch != null) {
                if (isPlayer1) {
                    nextMatch.setPlayer1Id(winnerId);
                } else {
                    nextMatch.setPlayer2Id(winnerId);
                }
                matchRepository.save(nextMatch);
            }
        }
    }

    @PostMapping("/{id}/matches/{matchId}/ready")
    @Transactional
    public ResponseEntity<?> readyUpMatch(
            @PathVariable Long id,
            @PathVariable Long matchId,
            HttpServletRequest request) {

        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body("No autorizado: token inválido o ausente");
        }

        PhysicalTournamentMatch match = matchRepository.findById(matchId).orElse(null);
        if (match == null || !match.getTournamentId().equals(id)) {
            return ResponseEntity.badRequest().body("Enfrentamiento no encontrado en este torneo");
        }

        if (match.getIsCompleted() != null && match.getIsCompleted()) {
            return ResponseEntity.badRequest().body("Este enfrentamiento ya ha finalizado.");
        }

        if (!userId.equals(match.getPlayer1Id()) && !userId.equals(match.getPlayer2Id())) {
            return ResponseEntity.status(403).body("No eres participante de esta partida.");
        }

        if (userId.equals(match.getPlayer1Id())) {
            match.setPlayer1Ready(true);
        } else {
            match.setPlayer2Ready(true);
        }

        matchRepository.save(match);

        boolean p1Ready = match.getPlayer1Ready() != null && match.getPlayer1Ready();
        boolean p2Ready = match.getPlayer2Ready() != null && match.getPlayer2Ready();

        if (p1Ready && p2Ready && match.getGameRoomId() == null) {
            String roomCode = "TORNEO-" + id + "-M" + matchId;
            try {
                com.mus.backend.engine.GameSession session = sessionManager.createRoom(roomCode);
                session.getConfig().setReyesOption("8");
                session.getConfig().setMaxRounds(3);

                String uname1 = userRepository.findById(match.getPlayer1Id())
                        .map(com.mus.backend.model.User::getUsername).orElse("Jugador 1");
                session.addPlayer(0, match.getPlayer1Id(), uname1);

                String uname2 = userRepository.findById(match.getPlayer2Id())
                        .map(com.mus.backend.model.User::getUsername).orElse("Jugador 2");
                session.addPlayer(1, match.getPlayer2Id(), uname2);

                session.addBot(2);
                session.addBot(3);

                match.setGameRoomId(roomCode);
                matchRepository.save(match);

                sessionManager.saveNewGameToDb(session);
            } catch (Exception e) {
                System.err.println("Error creating tournament game room: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(match);
    }

    @PostMapping("/{id}/matches/{matchId}/cancel-ready")
    @Transactional
    public ResponseEntity<?> cancelReadyMatch(
            @PathVariable Long id,
            @PathVariable Long matchId,
            HttpServletRequest request) {

        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body("No autorizado: token inválido o ausente");
        }

        PhysicalTournamentMatch match = matchRepository.findById(matchId).orElse(null);
        if (match == null || !match.getTournamentId().equals(id)) {
            return ResponseEntity.badRequest().body("Enfrentamiento no encontrado en este torneo");
        }

        if (match.getIsCompleted() != null && match.getIsCompleted()) {
            return ResponseEntity.badRequest().body("Este enfrentamiento ya ha finalizado.");
        }

        if (match.getGameRoomId() != null) {
            return ResponseEntity.badRequest().body("La partida ya ha comenzado.");
        }

        if (!userId.equals(match.getPlayer1Id()) && !userId.equals(match.getPlayer2Id())) {
            return ResponseEntity.status(403).body("No eres participante de esta partida.");
        }

        if (userId.equals(match.getPlayer1Id())) {
            match.setPlayer1Ready(false);
        } else {
            match.setPlayer2Ready(false);
        }

        matchRepository.save(match);
        return ResponseEntity.ok(match);
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
        match.setIsCompleted(true);
        matchRepository.save(match);

        advanceWinner(id, match.getRoundNumber(), match.getMatchIndex(), winnerId);

        checkAndAdvanceRound(tournament);

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

