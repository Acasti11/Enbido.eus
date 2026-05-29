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

    @Column(name = "location")
    private String location;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "missing_players")
    private Integer missingPlayers;

    @Column(name = "description")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "scheduled_at")
    private java.time.LocalDateTime scheduledAt;

    @Column(name = "establishment_type")
    private String establishmentType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "creator_id", insertable = false, updatable = false)
    private Usuario creator;
}
