package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_login")
@Data
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "name", nullable = false)
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

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(name = "username", unique = true, nullable = false)
    private String username;

    @Column(name = "role")
    private String role;

    @Column(name = "is_banned")
    private Boolean isBanned;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "two_factor_enabled")
    private Boolean twoFactorEnabled = false;

    @Column(name = "two_factor_code")
    private String twoFactorCode;

    @Column(name = "two_factor_code_expires_at")
    private LocalDateTime twoFactorCodeExpiresAt;

    @Column(name = "reset_password_token")
    private String resetPasswordToken;

    @Column(name = "reset_password_token_expires_at")
    private LocalDateTime resetPasswordTokenExpiresAt;
}