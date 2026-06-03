package com.mus.backend.repository;

import com.mus.backend.model.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    List<Friendship> findByUserId1AndStatusOrUserId2AndStatus(Long userId1, String status1, Long userId2, String status2);

    List<Friendship> findByUserId2AndStatus(Long userId, String status);

    List<Friendship> findByUserId1AndStatus(Long userId, String status);

    Optional<Friendship> findByUserId1AndUserId2OrUserId2AndUserId1(Long userId1, Long userId2, Long userId2Dup, Long userId1Dup);

    @Query("SELECT f FROM Friendship f WHERE (f.userId1 = :u1 AND f.userId2 = :u2) OR (f.userId1 = :u2 AND f.userId2 = :u1)")
    Optional<Friendship> findRelation(@Param("u1") Long u1, @Param("u2") Long u2);
}
