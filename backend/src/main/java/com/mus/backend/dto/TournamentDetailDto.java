package com.mus.backend.dto;

import com.mus.backend.model.PhysicalTournament;
import com.mus.backend.model.PhysicalTournamentMatch;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TournamentDetailDto {
    private PhysicalTournament tournament;
    private List<ParticipantInfo> participants;
    private List<PhysicalTournamentMatch> matches;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ParticipantInfo {
        private Long userId;
        private String username;
    }
}
