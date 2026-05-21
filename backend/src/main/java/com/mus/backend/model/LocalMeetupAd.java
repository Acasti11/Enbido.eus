package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "local_meetup_ad")
@Data
public class LocalMeetupAd {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ad_id")
    private Long adId;

    @Column(name = "creator_id")
    private Long creatorId;

    @Transient
    private String creatorName;

    private String location;
    
    @Column(name = "missing_players")
    private int missingPlayers;
    
    private String description;

    @Column(name = "is_active")
    private boolean isActive = true;
}
