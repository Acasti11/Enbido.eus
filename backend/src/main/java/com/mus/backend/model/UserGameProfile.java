package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_game_profile")
@Data

public class UserGameProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "elo")
    private Integer elo = 1500; // Glicko-2 default starting rating

    @Column(name = "rating_deviation")
    private Double ratingDeviation = 350.0; // Glicko-2 default RD

    @Column(name = "volatility")
    private Double volatility = 0.06; // Glicko-2 default volatility

    @Column(name = "matchmaking_ban_until")
    private LocalDateTime matchmakingBanUntil;

    @Column(name = "is_low_priority")
    private Boolean isLowPriority = false;

    @Column(name = "abandoned_games_count")
    private Integer abandonedGamesCount = 0;

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

    @Column(name = "equipped_board_item_id")
    private Integer equippedBoardItemId;

    @Column(name = "music_enabled")
    private Boolean musicEnabled = true;

    @Column(name = "music_volume")
    private Double musicVolume = 0.5;

    @Column(name = "sound_enabled")
    private Boolean soundEnabled = true;

    @Column(name = "sound_volume")
    private Double soundVolume = 0.5;

    @Column(name = "view_mode")
    private String viewMode = "2d";

    @Column(name = "language")
    private String language = "es";

    @Column(name = "notifications_enabled")
    private Boolean notificationsEnabled = true;

    public UserGameProfile() {}

    public UserGameProfile(Long userId) {
        this.userId = userId;
        this.elo = 1500;
        this.ratingDeviation = 350.0;
        this.volatility = 0.06;
        this.isLowPriority = false;
        this.abandonedGamesCount = 0;
        this.coins = 100; // Monedas iniciales de cortesía
        this.totalGamesPlayed = 0;
        this.totalGamesWon = 0;
        this.musicEnabled = true;
        this.musicVolume = 0.5;
        this.soundEnabled = true;
        this.soundVolume = 0.5;
        this.viewMode = "2d";
        this.language = "es";
        this.notificationsEnabled = true;
    }

    // Safe getters to protect against legacy database records having nulls
    public Integer getElo() {
        return elo != null ? elo : 1500;
    }

    public Double getRatingDeviation() {
        return ratingDeviation != null ? ratingDeviation : 350.0;
    }

    public Double getVolatility() {
        return volatility != null ? volatility : 0.06;
    }

    public Boolean getIsLowPriority() {
        return isLowPriority != null ? isLowPriority : false;
    }

    public Integer getAbandonedGamesCount() {
        return abandonedGamesCount != null ? abandonedGamesCount : 0;
    }
}
