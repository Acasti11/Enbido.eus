package com.mus.backend.repository;

import com.mus.backend.model.OAuthAuth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OAuthAuthRepository extends JpaRepository<OAuthAuth, Long> {

    Optional<OAuthAuth> findByProviderAndProviderUserId(String provider, String providerUserId);

    List<OAuthAuth> findByUser_UserId(Long userId);

    boolean existsByProviderAndProviderUserId(String provider, String providerUserId);
}
