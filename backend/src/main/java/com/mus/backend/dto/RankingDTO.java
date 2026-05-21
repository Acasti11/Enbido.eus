package com.mus.backend.dto;

import lombok.Data;

@Data
public class RankingDTO {
    private int rankPosition;
    private String username;
    private int elo;
    private int totalGamesPlayed;
    private int totalGamesWon;
    private double winRate;

    public RankingDTO() {}

    public RankingDTO(int rankPosition, String username, int elo, int totalGamesPlayed, int totalGamesWon, double winRate) {
        this.rankPosition = rankPosition;
        this.username = username;
        this.elo = elo;
        this.totalGamesPlayed = totalGamesPlayed;
        this.totalGamesWon = totalGamesWon;
        this.winRate = winRate;
    }
}
