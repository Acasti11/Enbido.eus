package com.mus.backend.repository;

import com.mus.backend.model.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {

    @Query("SELECT m FROM DirectMessage m WHERE (m.senderId = :u1 AND m.receiverId = :u2) OR (m.senderId = :u2 AND m.receiverId = :u1) ORDER BY m.sentAt ASC")
    List<DirectMessage> findChatHistory(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT m FROM DirectMessage m WHERE m.receiverId = :userId ORDER BY m.sentAt DESC")
    List<DirectMessage> findReceivedMessages(@Param("userId") Long userId);
}
