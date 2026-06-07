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
                tournament, partInfos, matches);
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
                return ResponseEntity.badRequest()
                        .body("No tienes suficientes monedas (tx) para inscribirte. Requieres " + fee + " tx");
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
        int numTeams;
        if (parts.size() <= 2) {
            numTeams = 2;
        } else {
            numTeams = (int) Math.ceil(parts.size() / 2.0);
        }

        int startingRound;
        if (numTeams > 4) {
            startingRound = 1; // Quarterfinals
        } else if (numTeams > 2) {
            startingRound = 2; // Semifinals
        } else {
            startingRound = 3; // Grand Final
        }

        Long id = tournament.getTournamentId();

        // Balanced team assignment: leaders first, then partners
        Long[] teamLeaders = new Long[numTeams];
        Long[] teamPartners = new Long[numTeams];
        int playerIdx = 0;
        long botIdCounter = -1;
        for (int i = 0; i < numTeams; i++) {
            if (playerIdx < parts.size()) {
                teamLeaders[i] = parts.get(playerIdx++).getUserId();
            } else {
                teamLeaders[i] = botIdCounter--;
            }
        }
        for (int i = 0; i < numTeams; i++) {
            if (playerIdx < parts.size()) {
                teamPartners[i] = parts.get(playerIdx++).getUserId();
            } else {
                teamPartners[i] = botIdCounter--;
            }
        }

        List<PhysicalTournamentMatch> existing = matchRepository.findByTournamentId(id);
        if (!existing.isEmpty()) {
            matchRepository.deleteAll(existing);
        }

        // Create Round 1 (Quarterfinals) if startingRound == 1
        if (startingRound == 1) {
            for (int i = 0; i < 4; i++) {
                Long p1 = (2 * i < numTeams) ? teamLeaders[2 * i] : null;
                Long p1Partner = (2 * i < numTeams) ? teamPartners[2 * i] : null;
                Long p2 = (2 * i + 1 < numTeams) ? teamLeaders[2 * i + 1] : null;
                Long p2Partner = (2 * i + 1 < numTeams) ? teamPartners[2 * i + 1] : null;

                PhysicalTournamentMatch match = new PhysicalTournamentMatch();
                match.setTournamentId(id);
                match.setRoundNumber(1);
                match.setMatchIndex(i);
                match.setPlayer1Id(p1);
                match.setPlayer1PartnerId(p1Partner);
                match.setPlayer2Id(p2);
                match.setPlayer2PartnerId(p2Partner);
                match.setPlayer1Ready(p1 != null && p1 < 0);
                match.setPlayer1PartnerReady(p1Partner != null && p1Partner < 0);
                match.setPlayer2Ready(p2 != null && p2 < 0);
                match.setPlayer2PartnerReady(p2Partner != null && p2Partner < 0);
                match.setIsCompleted(false);
                matchRepository.save(match);
            }
        }

        // Create Round 2 (Semifinals) if startingRound <= 2
        if (startingRound <= 2) {
            for (int i = 0; i < 2; i++) {
                Long p1 = (startingRound == 2 && 2 * i < numTeams) ? teamLeaders[2 * i] : null;
                Long p1Partner = (startingRound == 2 && 2 * i < numTeams) ? teamPartners[2 * i] : null;
                Long p2 = (startingRound == 2 && 2 * i + 1 < numTeams) ? teamLeaders[2 * i + 1] : null;
                Long p2Partner = (startingRound == 2 && 2 * i + 1 < numTeams) ? teamPartners[2 * i + 1] : null;

                PhysicalTournamentMatch match = new PhysicalTournamentMatch();
                match.setTournamentId(id);
                match.setRoundNumber(2);
                match.setMatchIndex(i);
                match.setPlayer1Id(p1);
                match.setPlayer1PartnerId(p1Partner);
                match.setPlayer2Id(p2);
                match.setPlayer2PartnerId(p2Partner);
                match.setPlayer1Ready(p1 != null && p1 < 0);
                match.setPlayer1PartnerReady(p1Partner != null && p1Partner < 0);
                match.setPlayer2Ready(p2 != null && p2 < 0);
                match.setPlayer2PartnerReady(p2Partner != null && p2Partner < 0);
                match.setIsCompleted(false);
                matchRepository.save(match);
            }
        }

        // Create Round 3 (Grand Final)
        {
            Long p1 = (startingRound == 3 && 0 < numTeams) ? teamLeaders[0] : null;
            Long p1Partner = (startingRound == 3 && 0 < numTeams) ? teamPartners[0] : null;
            Long p2 = (startingRound == 3 && 1 < numTeams) ? teamLeaders[1] : null;
            Long p2Partner = (startingRound == 3 && 1 < numTeams) ? teamPartners[1] : null;

            PhysicalTournamentMatch match = new PhysicalTournamentMatch();
            match.setTournamentId(id);
            match.setRoundNumber(3);
            match.setMatchIndex(0);
            match.setPlayer1Id(p1);
            match.setPlayer1PartnerId(p1Partner);
            match.setPlayer2Id(p2);
            match.setPlayer2PartnerId(p2Partner);
            match.setPlayer1Ready(p1 != null && p1 < 0);
            match.setPlayer1PartnerReady(p1Partner != null && p1Partner < 0);
            match.setPlayer2Ready(p2 != null && p2 < 0);
            match.setPlayer2PartnerReady(p2Partner != null && p2Partner < 0);
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
                    List<PhysicalTournamentParticipant> parts = participantRepository
                            .findByTournamentId(t.getTournamentId());
                    if (parts.size() >= 2) {
                        try {
                            System.out.println(
                                    "Auto-starting tournament ID: " + t.getTournamentId() + " (" + t.getTitle() + ")");
                            startTournamentInternal(t, parts);
                        } catch (Exception e) {
                            System.err.println("Error auto-starting tournament: " + e.getMessage());
                        }
                    } else {
                        t.setStatus("cancelled");
                        tournamentRepository.save(t);

                        // Refund registration fees to participants when the tournament is cancelled
                        int fee = t.getCoinsFee() != null ? t.getCoinsFee() : 0;
                        if (fee > 0) {
                            for (PhysicalTournamentParticipant p : parts) {
                                try {
                                    profileRepository.findById(p.getUserId()).ifPresent(profile -> {
                                        profile.setCoins((profile.getCoins() != null ? profile.getCoins() : 0) + fee);
                                        profileRepository.save(profile);
                                    });
                                } catch (Exception ex) {
                                    System.err.println("Error refunding coins for user " + p.getUserId() + ": " + ex.getMessage());
                                }
                            }
                        }
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
                    if (m.getPlayer1Id() < 0 && m.getPlayer2Id() < 0) {
                        m.setIsCompleted(true);
                        m.setWinnerId(m.getPlayer1Id());
                        m.setScore("3-0");
                        matchRepository.save(m);
                        advanceWinner(tournamentId, activeRound, m.getMatchIndex(), m.getPlayer1Id());
                        stateChanged = true;
                    } else if (m.getRoundStartTime() == null) {
                        m.setRoundStartTime(now);
                        matchRepository.save(m);
                        stateChanged = true;
                    } else if (m.getGameRoomId() == null) {
                        if (m.getRoundStartTime().plusMinutes(5).isBefore(now)) {
                            boolean t1Ready = (m.getPlayer1Ready() != null && m.getPlayer1Ready()) &&
                                    (m.getPlayer1PartnerId() == null
                                            || (m.getPlayer1PartnerReady() != null && m.getPlayer1PartnerReady()));
                            boolean t2Ready = (m.getPlayer2Ready() != null && m.getPlayer2Ready()) &&
                                    (m.getPlayer2PartnerId() == null
                                            || (m.getPlayer2PartnerReady() != null && m.getPlayer2PartnerReady()));

                            m.setIsCompleted(true);
                            if (t1Ready && !t2Ready) {
                                m.setWinnerId(m.getPlayer1Id());
                                m.setScore("W/O");
                                advanceWinner(tournamentId, activeRound, m.getMatchIndex(), m.getPlayer1Id());
                            } else if (!t1Ready && t2Ready) {
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
                    Long p1 = finalMatch.getPlayer1Id();
                    Long p1P = finalMatch.getPlayer1PartnerId();
                    Long p2 = finalMatch.getPlayer2Id();
                    Long p2P = finalMatch.getPlayer2PartnerId();

                    Long w1 = null;
                    Long w2 = null;
                    if (winnerId.equals(p1) || (p1P != null && winnerId.equals(p1P))) {
                        w1 = p1;
                        w2 = p1P;
                    } else if (winnerId.equals(p2) || (p2P != null && winnerId.equals(p2P))) {
                        w1 = p2;
                        w2 = p2P;
                    }

                    if (w1 != null) {
                        final Long fw1 = w1;
                        UserGameProfile profile = profileRepository.findById(fw1).orElseGet(() -> new UserGameProfile(fw1));
                        profile.setCoins((profile.getCoins() != null ? profile.getCoins() : 0) + prize);
                        profileRepository.save(profile);
                    }

                    if (w2 != null) {
                        final Long fw2 = w2;
                        UserGameProfile profile = profileRepository.findById(fw2).orElseGet(() -> new UserGameProfile(fw2));
                        profile.setCoins((profile.getCoins() != null ? profile.getCoins() : 0) + prize);
                        profileRepository.save(profile);
                    }
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
            PhysicalTournamentMatch currentMatch = matchRepository
                    .findByTournamentIdAndRoundNumberAndMatchIndex(tournamentId, currentRound, matchIndex);

            if (nextMatch != null && currentMatch != null) {
                Long pWinner = null;
                Long pWinnerPartner = null;

                if (winnerId.equals(currentMatch.getPlayer1Id()) || (currentMatch.getPlayer1PartnerId() != null
                        && winnerId.equals(currentMatch.getPlayer1PartnerId()))) {
                    pWinner = currentMatch.getPlayer1Id();
                    pWinnerPartner = currentMatch.getPlayer1PartnerId();
                } else if (winnerId.equals(currentMatch.getPlayer2Id()) || (currentMatch.getPlayer2PartnerId() != null
                        && winnerId.equals(currentMatch.getPlayer2PartnerId()))) {
                    pWinner = currentMatch.getPlayer2Id();
                    pWinnerPartner = currentMatch.getPlayer2PartnerId();
                }

                if (isPlayer1) {
                    nextMatch.setPlayer1Id(pWinner);
                    nextMatch.setPlayer1PartnerId(pWinnerPartner);
                    nextMatch.setPlayer1Ready(pWinner != null && pWinner < 0);
                    nextMatch.setPlayer1PartnerReady(pWinnerPartner != null && pWinnerPartner < 0);
                } else {
                    nextMatch.setPlayer2Id(pWinner);
                    nextMatch.setPlayer2PartnerId(pWinnerPartner);
                    nextMatch.setPlayer2Ready(pWinner != null && pWinner < 0);
                    nextMatch.setPlayer2PartnerReady(pWinnerPartner != null && pWinnerPartner < 0);
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

        if (!userId.equals(match.getPlayer1Id()) && !userId.equals(match.getPlayer2Id()) &&
                !userId.equals(match.getPlayer1PartnerId()) && !userId.equals(match.getPlayer2PartnerId())) {
            return ResponseEntity.status(403).body("No eres participante de esta partida.");
        }

        if (userId.equals(match.getPlayer1Id())) {
            match.setPlayer1Ready(true);
        } else if (userId.equals(match.getPlayer2Id())) {
            match.setPlayer2Ready(true);
        } else if (userId.equals(match.getPlayer1PartnerId())) {
            match.setPlayer1PartnerReady(true);
        } else if (userId.equals(match.getPlayer2PartnerId())) {
            match.setPlayer2PartnerReady(true);
        }

        matchRepository.save(match);

        boolean p1Ready = match.getPlayer1Ready() != null && match.getPlayer1Ready();
        boolean p2Ready = match.getPlayer2Ready() != null && match.getPlayer2Ready();
        boolean p1PartnerReady = match.getPlayer1PartnerId() == null
                || (match.getPlayer1PartnerReady() != null && match.getPlayer1PartnerReady());
        boolean p2PartnerReady = match.getPlayer2PartnerId() == null
                || (match.getPlayer2PartnerReady() != null && match.getPlayer2PartnerReady());

        if (p1Ready && p2Ready && p1PartnerReady && p2PartnerReady && match.getGameRoomId() == null) {
            String roomCode = "TORNEO-" + id + "-M" + matchId;
            try {
                com.mus.backend.engine.GameSession session = sessionManager.createRoom(roomCode);
                session.getConfig().setReyesOption("8");
                session.getConfig().setMaxRounds(3);

                if (match.getPlayer1Id() != null && match.getPlayer1Id() > 0) {
                    String uname1 = userRepository.findById(match.getPlayer1Id())
                            .map(com.mus.backend.model.User::getUsername).orElse("Jugador 1");
                    session.addPlayer(0, match.getPlayer1Id(), uname1);
                } else {
                    session.addBot(0);
                }

                if (match.getPlayer2Id() != null && match.getPlayer2Id() > 0) {
                    String uname2 = userRepository.findById(match.getPlayer2Id())
                            .map(com.mus.backend.model.User::getUsername).orElse("Jugador 2");
                    session.addPlayer(1, match.getPlayer2Id(), uname2);
                } else {
                    session.addBot(1);
                }

                if (match.getPlayer1PartnerId() != null && match.getPlayer1PartnerId() > 0) {
                    String uname1P = userRepository.findById(match.getPlayer1PartnerId())
                            .map(com.mus.backend.model.User::getUsername).orElse("Compañero 1");
                    session.addPlayer(2, match.getPlayer1PartnerId(), uname1P);
                } else {
                    session.addBot(2);
                }

                if (match.getPlayer2PartnerId() != null && match.getPlayer2PartnerId() > 0) {
                    String uname2P = userRepository.findById(match.getPlayer2PartnerId())
                            .map(com.mus.backend.model.User::getUsername).orElse("Compañero 2");
                    session.addPlayer(3, match.getPlayer2PartnerId(), uname2P);
                } else {
                    session.addBot(3);
                }

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

        if (!userId.equals(match.getPlayer1Id()) && !userId.equals(match.getPlayer2Id()) &&
                !userId.equals(match.getPlayer1PartnerId()) && !userId.equals(match.getPlayer2PartnerId())) {
            return ResponseEntity.status(403).body("No eres participante de esta partida.");
        }

        if (userId.equals(match.getPlayer1Id())) {
            match.setPlayer1Ready(false);
        } else if (userId.equals(match.getPlayer2Id())) {
            match.setPlayer2Ready(false);
        } else if (userId.equals(match.getPlayer1PartnerId())) {
            match.setPlayer1PartnerReady(false);
        } else if (userId.equals(match.getPlayer2PartnerId())) {
            match.setPlayer2PartnerReady(false);
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
