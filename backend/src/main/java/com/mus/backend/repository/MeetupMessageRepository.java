package com.mus.backend.repository;

import com.mus.backend.model.MeetupMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetupMessageRepository extends JpaRepository<MeetupMessage, Long> {
    List<MeetupMessage> findByAdIdOrderBySentAtAsc(Long adId);
}
