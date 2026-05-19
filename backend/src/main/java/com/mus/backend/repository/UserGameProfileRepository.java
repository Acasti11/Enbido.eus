package com.mus.backend.repository;

import com.mus.backend.model.UserGameProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserGameProfileRepository extends JpaRepository<UserGameProfile, Long> {
}
