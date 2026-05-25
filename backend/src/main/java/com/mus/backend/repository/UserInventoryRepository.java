package com.mus.backend.repository;

import com.mus.backend.model.UserInventory;
import com.mus.backend.model.UserInventoryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserInventoryRepository extends JpaRepository<UserInventory, UserInventoryId> {
    List<UserInventory> findByUserId(Long userId);
    Optional<UserInventory> findByUserIdAndItemItemId(Long userId, Long itemId);
    boolean existsByUserIdAndItemItemId(Long userId, Long itemId);
}
