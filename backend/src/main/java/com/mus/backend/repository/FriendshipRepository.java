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

    @Query("SELECT f FROM Friendship f WHERE (f.userId1 = :userId OR f.userId2 = :userId) AND f.status = 'accepted'")
    List<Friendship> findAcceptedFriends(@Param("userId") Long userId);

    @Query("SELECT f FROM Friendship f WHERE f.userId2 = :userId AND f.status = 'pending'")
    List<Friendship> findPendingRequestsReceived(@Param("userId") Long userId);

    @Query("SELECT f FROM Friendship f WHERE f.userId1 = :userId AND f.status = 'pending'")
    List<Friendship> findPendingRequestsSent(@Param("userId") Long userId);

    @Query("SELECT f FROM Friendship f WHERE (f.userId1 = :u1 AND f.userId2 = :u2) OR (f.userId1 = :u2 AND f.userId2 = :u1)")
    Optional<Friendship> findFriendshipBetween(@Param("u1") Long u1, @Param("u2") Long u2);
}
