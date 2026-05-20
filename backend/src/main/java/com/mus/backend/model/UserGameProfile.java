package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "user_game_profile")
@Data

public class UserGameProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "elo")
    private Integer elo = 200;

    @Column(name = "coins")
    private Integer coins = 0;

    @Column(name = "total_games_played")
    private Integer totalGamesPlayed = 0;

    @Column(name = "total_games_won")
    private Integer totalGamesWon = 0;

    @Column(name = "equipped_avatar_item_id")
    private Integer equippedAvatarItemId;

    @Column(name = "equipped_deck_item_id")
    private Integer equippedDeckItemId;

    @Column(name = "equipped_title_item_id")
    private Integer equippedTitleItemId;

    public UserGameProfile() {}

    public UserGameProfile(Long userId) {
        this.userId = userId;
        this.elo = 200;
        this.coins = 100; // Monedas iniciales de cortesía
        this.totalGamesPlayed = 0;
        this.totalGamesWon = 0;
    }
}
