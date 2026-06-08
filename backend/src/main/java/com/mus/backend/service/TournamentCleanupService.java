package com.mus.backend.service;

import com.mus.backend.model.PhysicalTournament;
import com.mus.backend.repository.PhysicalTournamentMatchRepository;
import com.mus.backend.repository.PhysicalTournamentParticipantRepository;
import com.mus.backend.repository.PhysicalTournamentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TournamentCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(TournamentCleanupService.class);

    @Autowired
    private PhysicalTournamentRepository tournamentRepository;

    @Autowired
    private PhysicalTournamentMatchRepository matchRepository;

    @Autowired
    private PhysicalTournamentParticipantRepository participantRepository;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupFinishedOnlineTournaments() {
        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);

        List<PhysicalTournament> tournamentsToDelete = tournamentRepository
                .findByTypeAndStatusAndFinishedAtBefore("ONLINE", "finished", fiveMinutesAgo);

        if (!tournamentsToDelete.isEmpty()) {
            logger.info("Deleting {} finished tournaments older than 5 minutes", tournamentsToDelete.size());
        }

        for (PhysicalTournament tournament : tournamentsToDelete) {
            Long tournamentId = tournament.getTournamentId();
            matchRepository.deleteAll(matchRepository.findByTournamentId(tournamentId));
            participantRepository.deleteAll(participantRepository.findByTournamentId(tournamentId));
            tournamentRepository.delete(tournament);
            logger.info("Auto-deleted tournament ID: {} ({})", tournamentId, tournament.getTitle());
        }
    }
}
