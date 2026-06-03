package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "surname", length = 100)
    private String surname;

    @Column(name = "email", unique = true, nullable = false, length = 150)
    private String email;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "username", unique = true, length = 50)
    private String username;

    @Column(name = "role", length = 20)
    @Enumerated(EnumType.STRING)
    private Role role = Role.user;

    @Column(name = "is_banned")
    private Boolean isBanned = false;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "profile_picture", length = 500)
    private String profilePicture;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relación 1:1 opcional con local_auth
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private LocalAuth localAuth;

    // Relación 1:N con oauth_auth
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<OAuthAuth> oauthAuths = new ArrayList<>();

    public enum Role {
        user, admin
    }
}
