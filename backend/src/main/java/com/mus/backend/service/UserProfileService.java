package com.mus.backend.service;

import com.mus.backend.dto.UserLeaderboardDto;
import com.mus.backend.model.UserGameProfile;
import com.mus.backend.model.Usuario;
import com.mus.backend.repository.ItemRepository;
import com.mus.backend.repository.UserGameProfileRepository;
import com.mus.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserProfileService {

    @Autowired
    private UserGameProfileRepository profileRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ItemRepository itemRepository;

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

    public List<UserLeaderboardDto> getLeaderboard() {
        List<UserGameProfile> profiles = profileRepository.findAllOrderByEloDesc();
        return profiles.stream().map(profile -> {
            String username = usuarioRepository.findById(profile.getUserId())
                    .map(Usuario::getUsername)
                    .orElse("Usuario Desconocido");

            int total = profile.getTotalGamesPlayed() != null ? profile.getTotalGamesPlayed() : 0;
            int won = profile.getTotalGamesWon() != null ? profile.getTotalGamesWon() : 0;
            int winRate = total > 0 ? (int) Math.round((double) won / total * 100) : 0;

            String equippedTitle = "Sin Título";
            if (profile.getEquippedTitleItemId() != null) {
                equippedTitle = itemRepository.findById((long) profile.getEquippedTitleItemId())
                        .map(com.mus.backend.model.Item::getName)
                        .orElse("Sin Título");
            }

            return new UserLeaderboardDto(
                    profile.getUserId(),
                    username,
                    profile.getElo() != null ? profile.getElo() : 200,
                    total,
                    won,
                    winRate,
                    equippedTitle
            );
        }).collect(Collectors.toList());
    }
}
