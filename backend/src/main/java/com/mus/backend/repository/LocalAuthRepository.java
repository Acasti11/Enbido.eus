package com.mus.backend.repository;

import com.mus.backend.model.LocalAuth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LocalAuthRepository extends JpaRepository<LocalAuth, Long> {

    Optional<LocalAuth> findByUser_UserId(Long userId);

    Optional<LocalAuth> findByResetPasswordToken(String resetPasswordToken);

    boolean existsByUser_UserId(Long userId);
}
