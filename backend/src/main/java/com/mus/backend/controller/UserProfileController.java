package com.mus.backend.controller;

import com.mus.backend.model.UserGameProfile;
import com.mus.backend.repository.UserGameProfileRepository;
import com.mus.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UserProfileController {

    @Autowired
    private UserGameProfileRepository profileRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/{userId}/profile")
    public ResponseEntity<?> getUserProfile(@PathVariable Long userId) {
        if (!usuarioRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }

        // Si no existe perfil en la base de datos, lo inicializamos dinámicamente
        UserGameProfile profile = profileRepository.findById(userId)
                .orElseGet(() -> {
                    UserGameProfile newProfile = new UserGameProfile(userId);
                    return profileRepository.save(newProfile);
                });

        return ResponseEntity.ok(profile);
    }

    @PutMapping("/{userId}/profile")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long userId, @RequestBody UserGameProfile updatedDetails) {
        return profileRepository.findById(userId).map(profile -> {
            profile.setElo(updatedDetails.getElo());
            profile.setCoins(updatedDetails.getCoins());
            profile.setTotalGamesPlayed(updatedDetails.getTotalGamesPlayed());
            profile.setTotalGamesWon(updatedDetails.getTotalGamesWon());
            profile.setEquippedAvatarItemId(updatedDetails.getEquippedAvatarItemId());
            profile.setEquippedDeckItemId(updatedDetails.getEquippedDeckItemId());
            profile.setEquippedTitleItemId(updatedDetails.getEquippedTitleItemId());
            profile.setEquippedBoardItemId(updatedDetails.getEquippedBoardItemId());
            UserGameProfile saved = profileRepository.save(profile);
            return ResponseEntity.ok(saved);
        }).orElseGet(() -> {
            updatedDetails.setUserId(userId);
            UserGameProfile saved = profileRepository.save(updatedDetails);
            return ResponseEntity.ok(saved);
        });
    }
}
