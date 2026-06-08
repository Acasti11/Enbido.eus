package com.mus.backend.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private UserDTO user;

    public AuthResponse() {}

    public AuthResponse(UserDTO user) {
        this.user = user;
    }
}
