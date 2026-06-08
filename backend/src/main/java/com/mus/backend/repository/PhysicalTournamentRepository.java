package com.mus.backend.repository;

import com.mus.backend.model.PhysicalTournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PhysicalTournamentRepository extends JpaRepository<PhysicalTournament, Long> {
    List<PhysicalTournament> findByTypeAndStatusAndFinishedAtBefore(
            String type, String status, LocalDateTime finishedAt);
}
