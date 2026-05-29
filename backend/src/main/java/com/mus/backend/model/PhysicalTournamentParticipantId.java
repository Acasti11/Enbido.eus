package com.mus.backend.model;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhysicalTournamentParticipantId implements Serializable {
    private Long tournamentId;
    private Long userId;
}
