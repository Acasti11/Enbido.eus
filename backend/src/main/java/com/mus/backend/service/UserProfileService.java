package com.mus.backend.service;

import com.mus.backend.model.UserGameProfile;
import com.mus.backend.repository.UserGameProfileRepository;
import com.mus.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserProfileService {

    @Autowired
    private UserGameProfileRepository profileRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public boolean userExists(Long userId) {
        return usuarioRepository.existsById(userId);
    }

    public UserGameProfile getOrCreateUserProfile(Long userId) {
        return profileRepository.findById(userId)
                .orElseGet(() -> {
                    UserGameProfile newProfile = new UserGameProfile(userId);
                    return profileRepository.save(newProfile);
                });
    }

    public UserGameProfile updateUserProfile(Long userId, UserGameProfile updatedDetails) {
        return profileRepository.findById(userId).map(profile -> {
            profile.setElo(updatedDetails.getElo());
            profile.setCoins(updatedDetails.getCoins());
            profile.setTotalGamesPlayed(updatedDetails.getTotalGamesPlayed());
            profile.setTotalGamesWon(updatedDetails.getTotalGamesWon());
            profile.setEquippedAvatarItemId(updatedDetails.getEquippedAvatarItemId());
            profile.setEquippedDeckItemId(updatedDetails.getEquippedDeckItemId());
            profile.setEquippedTitleItemId(updatedDetails.getEquippedTitleItemId());
            //profile.setEquippedBoardItemId(updatedDetails.getEquippedBoardItemId());
            return profileRepository.save(profile);
        }).orElseGet(() -> {
            updatedDetails.setUserId(userId);
            return profileRepository.save(updatedDetails);
        });
    }
}
