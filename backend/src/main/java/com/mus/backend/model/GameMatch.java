package com.mus.backend.model;
import lombok.Data;

import jakarta.persistence.*;

@Entity
@Table(name = "game_matches")
@Data
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
}