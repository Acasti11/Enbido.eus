package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "friendships")
@Data
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "friendship_id")
    private Long friendshipId;

    @Column(name = "user_id_1")
    private Long userId1;

    @Column(name = "user_id_2")
    private Long userId2;

    @Column(name = "status")
    private String status = "pending"; // pending, accepted, rejected

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id_1", insertable = false, updatable = false)
    private Usuario user1;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id_2", insertable = false, updatable = false)
    private Usuario user2;
}
