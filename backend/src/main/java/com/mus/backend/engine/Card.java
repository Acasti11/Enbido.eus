package com.mus.backend.engine;

import lombok.Data;

@Data
public class Card {
    private String id;
    private String suit; // Oros, Copas, Espadas, Bastos
    private int rank; // 1 to 12 (Spanish deck)
    private int scoreValue; // for point calculations
    private String imagePath;

    public Card() {}

    public Card(String id, String suit, int rank) {
        this.id = id;
        this.suit = suit;
        this.rank = rank;
        
        // As / 2 es As (valor 1). 3 / Rey / Caballo / Sota es Figura (valor 10)
        if (rank == 1 || rank == 2) {
            this.scoreValue = 1;
        } else if (rank >= 10 || rank == 3) {
            this.scoreValue = 10;
        } else {
            this.scoreValue = rank;
        }
        
        // Ruta de la imagen coincidiendo con las de frontend
        this.imagePath = String.format("/cards/%s_%d.png", suit.toLowerCase(), rank);
    }
}
