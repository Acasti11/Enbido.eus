package com.mus.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserLeaderboardDto {
    private Long userId;
    private String username;
    private Integer elo;
    private Integer totalGamesPlayed;
    private Integer totalGamesWon;
    private Integer winRate;
    private String equippedTitle;
}
