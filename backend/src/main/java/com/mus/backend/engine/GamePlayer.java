package com.mus.backend.engine;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class GamePlayer {
    private Long userId; // null if Bot
    private String username;
    private boolean isBot;
    private List<Card> hand = new ArrayList<>();
    private String speechBubble = "";

    public GamePlayer() {}

    public GamePlayer(Long userId, String username, boolean isBot) {
        this.userId = userId;
        this.username = username;
        this.isBot = isBot;
    }
}
