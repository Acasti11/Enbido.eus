package com.mus.backend.repository;

import com.mus.backend.model.MeetupParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetupParticipantRepository extends JpaRepository<MeetupParticipant, Long> {
    List<MeetupParticipant> findByAdId(Long adId);
    Optional<MeetupParticipant> findByAdIdAndUserId(Long adId, Long userId);
}
