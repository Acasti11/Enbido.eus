package com.mus.backend.repository;

import com.mus.backend.model.PhysicalTournamentMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PhysicalTournamentMatchRepository extends JpaRepository<PhysicalTournamentMatch, Long> {
    List<PhysicalTournamentMatch> findByTournamentId(Long tournamentId);
    List<PhysicalTournamentMatch> findByTournamentIdAndRoundNumber(Long tournamentId, Integer roundNumber);
    PhysicalTournamentMatch findByTournamentIdAndRoundNumberAndMatchIndex(Long tournamentId, Integer roundNumber, Integer matchIndex);
}
