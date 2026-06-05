package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "meetup_participants")
@Data
public class MeetupParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meetup_participants_id")
    private Long id;

    @Column(name = "ad_id")
    private Long adId;

    @Column(name = "user_id")
    private Long userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
}
