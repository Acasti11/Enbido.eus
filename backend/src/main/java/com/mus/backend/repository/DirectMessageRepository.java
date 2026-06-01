package com.mus.backend.repository;

import com.mus.backend.model.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {

    List<DirectMessage> findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderBySentAtAsc(
            Long senderId1, Long receiverId1, Long senderId2, Long receiverId2);

    List<DirectMessage> findByReceiverIdOrderBySentAtDesc(Long receiverId);
}
