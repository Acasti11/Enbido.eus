package com.mus.backend.controller;

import com.mus.backend.model.UserGameProfile;
import com.mus.backend.service.UserProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UserProfileController {

    @Autowired
    private UserProfileService userProfileService;

    @GetMapping("/{userId}/profile")
    public ResponseEntity<?> getUserProfile(@PathVariable Long userId) {
        if (!userProfileService.userExists(userId)) {
            return ResponseEntity.notFound().build();
        }

        UserGameProfile profile = userProfileService.getOrCreateUserProfile(userId);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/{userId}/profile")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long userId, @RequestBody UserGameProfile updatedDetails) {
        UserGameProfile saved = userProfileService.updateUserProfile(userId, updatedDetails);
        return ResponseEntity.ok(saved);
    }
}
