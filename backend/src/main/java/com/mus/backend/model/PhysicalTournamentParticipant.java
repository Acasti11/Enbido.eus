package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "physical_tournament_participant")
@IdClass(PhysicalTournamentParticipantId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhysicalTournamentParticipant {

    @Id
    @Column(name = "tournament_id")
    private Long tournamentId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt = LocalDateTime.now();
}
