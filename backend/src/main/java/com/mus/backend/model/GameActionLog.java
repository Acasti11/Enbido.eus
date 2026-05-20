package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_action_log")
@Data
public class GameActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @Column(name = "game_id")
    private Long gameId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "action")
    private String action;

    @Column(name = "action_time")
    private LocalDateTime actionTime = LocalDateTime.now();

    public GameActionLog() {}

    public GameActionLog(Long gameId, Long userId, String action) {
        this.gameId = gameId;
        this.userId = userId;
        this.action = action;
        this.actionTime = LocalDateTime.now();
    }
}
