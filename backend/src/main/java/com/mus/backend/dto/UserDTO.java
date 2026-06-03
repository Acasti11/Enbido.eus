package com.mus.backend.dto;

import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String email;
    private String name;
    private String surname;
    private String username;
    private String role;
    private String profilePicture;

    public UserDTO() {}

    public UserDTO(Long id, String email, String name, String surname,
                   String username, String role, String profilePicture) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.surname = surname;
        this.username = username;
        this.role = role;
        this.profilePicture = profilePicture;
    }
}
