package com.mus.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "game_matches")
public class GameMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "score_us")
    private Integer scoreUs = 0;

    @Column(name = "score_them")
    private Integer scoreThem = 0;

    @Column(name = "status")
    private String status = "IN_PROGRESS";

    public GameMatch() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Integer getScoreUs() { return scoreUs; }
    public void setScoreUs(Integer scoreUs) { this.scoreUs = scoreUs; }

    public Integer getScoreThem() { return scoreThem; }
    public void setScoreThem(Integer scoreThem) { this.scoreThem = scoreThem; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}