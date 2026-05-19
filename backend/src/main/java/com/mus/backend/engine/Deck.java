package com.mus.backend.engine;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Deck {

    public static List<Card> createNewDeck() {
        List<Card> cards = new ArrayList<>();
        String[] suits = {"Oros", "Copas", "Espadas", "Bastos"};
        int[] ranks = {1, 2, 3, 4, 5, 6, 7, 10, 11, 12}; // Baraja española de 40 cartas

        for (String suit : suits) {
            for (int rank : ranks) {
                String id = String.format("%s_%d", suit.toLowerCase(), rank);
                cards.add(new Card(id, suit, rank));
            }
        }
        return cards;
    }

    public static List<Card> shuffle(List<Card> deck) {
        List<Card> shuffled = new ArrayList<>(deck);
        Collections.shuffle(shuffled);
        return shuffled;
    }
}
