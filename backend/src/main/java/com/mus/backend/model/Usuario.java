package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_login")
@Data
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "name")
    private String name;

    @Column(name = "surname")
    private String surname;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "postal_code")
    private String postalCode;

    @Column(name = "birth_date")
    private LocalDateTime birthDate;

    @Column(name = "username", unique = true, nullable = false)
    private String username;

    @Column(name = "role")
    private String role;

    @Column(name = "is_banned")
    private Boolean isBanned;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
}