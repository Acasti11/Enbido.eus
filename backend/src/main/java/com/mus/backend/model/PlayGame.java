package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "play_game")
@Data
public class PlayGame {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "game_id")
    private Long gameId;

    @Column(name = "player1")
    private Long player1;

    @Column(name = "player2")
    private Long player2;

    @Column(name = "player3")
    private Long player3;

    @Column(name = "player4")
    private Long player4;

    @Column(name = "game_state_id")
    private Integer gameStateId;

    @Column(name = "game_mode_id")
    private Integer gameModeId;

    @Column(name = "points_team_12")
    private Integer pointsTeam12 = 0;

    @Column(name = "points_team_34")
    private Integer pointsTeam34 = 0;

    @Column(name = "total_time_seconds")
    private Integer totalTimeSeconds;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "tournament_id")
    private Integer tournamentId;
}
