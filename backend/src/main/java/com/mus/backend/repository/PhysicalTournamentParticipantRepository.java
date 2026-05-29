package com.mus.backend.repository;

import com.mus.backend.model.PhysicalTournamentParticipant;
import com.mus.backend.model.PhysicalTournamentParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PhysicalTournamentParticipantRepository extends JpaRepository<PhysicalTournamentParticipant, PhysicalTournamentParticipantId> {
    List<PhysicalTournamentParticipant> findByTournamentId(Long tournamentId);
    boolean existsByTournamentIdAndUserId(Long tournamentId, Long userId);
    long countByTournamentId(Long tournamentId);
}
