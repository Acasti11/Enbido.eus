package com.mus.backend.engine;

import lombok.Data;

@Data
public class GameConfig {
    private String reyesOption = "8"; // "4" or "8"
    private int maxRounds = 3;        // Number of chicos (rounds) to win the match

    public GameConfig() {}

    public GameConfig(String reyesOption, int maxRounds) {
        if (reyesOption != null && (reyesOption.equals("4") || reyesOption.equals("8"))) {
            this.reyesOption = reyesOption;
        }
        if (maxRounds > 0) {
            this.maxRounds = maxRounds;
        }
    }
}
