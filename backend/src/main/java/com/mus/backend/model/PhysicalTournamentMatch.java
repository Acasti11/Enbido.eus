package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "physical_tournament_match")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhysicalTournamentMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "match_id")
    private Long matchId;

    @Column(name = "tournament_id")
    private Long tournamentId;

    @Column(name = "round_number")
    private Integer roundNumber;

    @Column(name = "match_index")
    private Integer matchIndex;

    @Column(name = "player1_id")
    private Long player1Id;

    @Column(name = "player2_id")
    private Long player2Id;

    @Column(name = "winner_id")
    private Long winnerId;

    @Column(name = "score")
    private String score = "";
}
