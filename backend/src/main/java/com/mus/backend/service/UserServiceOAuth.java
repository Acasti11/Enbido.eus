package com.mus.backend.service;

import com.mus.backend.model.User;
import com.mus.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserServiceOAuth {

    private final UserRepository userRepository;

    public UserServiceOAuth(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Find a user by email.
     *
     * @param email the email to search for
     * @return Optional containing the user if found
     */
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Find an existing user by Google email or create a new one.
     *
     * @param email    the Google email
     * @param name     the user's given name
     * @param surname  the user's family name
     * @param picture  the profile picture URL
     * @param googleUserId the Google subject ID
     * @return the existing or newly created user
     */
    @Transactional
    public User findOrCreateByGoogle(String email, String name, String surname,
                                     String picture, String googleUserId) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> createUser(name, surname, email, picture));
    }

    /**
     * Create a new user for OAuth login (no password, no local auth).
     *
     * @param name     the user's name
     * @param surname  the user's surname
     * @param email    the user's email
     * @param picture  the profile picture URL
     * @return the created user
     */
    @Transactional
    public User createUser(String name, String surname, String email, String picture) {
        User user = new User();
        user.setName(name);
        user.setSurname(surname);
        user.setEmail(email);
        user.setProfilePicture(picture);
        user.setRole(User.Role.user);
        user.setIsBanned(false);

        // Generate a unique username from email prefix
        String baseUsername = email.split("@")[0];
        String username = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + suffix;
            suffix++;
        }
        user.setUsername(username);

        return userRepository.save(user);
    }
}
