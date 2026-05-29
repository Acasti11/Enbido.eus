package com.mus.backend.engine;

import lombok.Data;

@Data
public class Card {
    private String id;
    private String suit; // Oros, Copas, Espadas, Bastos
    private int rank; // 1 to 12 (Spanish deck)
    private int scoreValue; // for point calculations (dynamic)
    private String imagePath;

    public Card() {}

    public Card(String id, String suit, int rank) {
        this.id = id;
        this.suit = suit;
        this.rank = rank;
        this.imagePath = String.format("/cards/%s_%d.png", suit.toLowerCase(), rank);
        updateScoreValue("8"); // Valor por defecto (8 reyes)
    }

    public void updateScoreValue(String reyesOption) {
        this.scoreValue = RulesEvaluator.getScoreValue(this.rank, reyesOption);
    }
}
