package com.mus.backend.dto;

import com.mus.backend.validator.MinAge;
import com.mus.backend.validator.PostalCodeES;
import com.mus.backend.validator.StrongPassword;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class UsuarioRegisterDto {

    @NotBlank(message = "Name is required")
    private String name;

    private String surname;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @StrongPassword
    private String password;

    private String phoneNumber;

    @PostalCodeES
    private String postalCode;

    @NotNull(message = "Birth date is required")
    @Past(message = "Birth date must be in the past")
    @MinAge(value = 3, message = "You must be at least 3 years old")
    private LocalDate birthDate;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;
}