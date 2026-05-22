package com.mus.backend.model;

import com.mus.backend.validator.MinAge;
import com.mus.backend.validator.PostalCodeES;
import com.mus.backend.validator.StrongPassword;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
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

    @NotBlank(message = "Name is required")
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "surname")
    private String surname;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @NotBlank(message = "Password is required")
    @StrongPassword  // ← CUSTOM
    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "phone_number")
    private String phoneNumber;

    @PostalCodeES  // ← CUSTOM
    @Column(name = "postal_code")
    private String postalCode;

    @NotNull(message = "Birth date is required")
    @Past(message = "Birth date must be in the past")
    @MinAge(value = 3, message = "You must be at least 3 years old")  // ← CUSTOM
    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Column(name = "username", unique = true, nullable = false)
    private String username;

    @Column(name = "role")
    private String role;

    @Column(name = "is_banned")
    private Boolean isBanned;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}