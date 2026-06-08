package com.mus.backend.service;

import com.mus.backend.model.PhysicalTournament;
import com.mus.backend.repository.PhysicalTournamentMatchRepository;
import com.mus.backend.repository.PhysicalTournamentParticipantRepository;
import com.mus.backend.repository.PhysicalTournamentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TournamentCleanupService {

    @Autowired
    private PhysicalTournamentRepository tournamentRepository;

    @Autowired
    private PhysicalTournamentMatchRepository matchRepository;

    @Autowired
    private PhysicalTournamentParticipantRepository participantRepository;

    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cleanupFinishedOnlineTournaments() {
        LocalDateTime thirtyMinutesAgo = LocalDateTime.now().minusMinutes(30);

        List<PhysicalTournament> tournamentsToDelete = tournamentRepository
                .findByTypeAndStatusAndFinishedAtBefore("ONLINE", "finished", thirtyMinutesAgo);

        for (PhysicalTournament tournament : tournamentsToDelete) {
            Long tournamentId = tournament.getTournamentId();
            matchRepository.deleteAll(matchRepository.findByTournamentId(tournamentId));
            participantRepository.deleteAll(participantRepository.findByTournamentId(tournamentId));
            tournamentRepository.delete(tournament);
        }
    }
}
