package com.mus.backend.repository;

import com.mus.backend.model.LocalMeetupAd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LocalMeetupAdRepository extends JpaRepository<LocalMeetupAd, Long> {
    List<LocalMeetupAd> findByIsActiveTrue();

    @Query("SELECT m FROM LocalMeetupAd m WHERE m.isActive = true AND (m.scheduledAt IS NULL OR m.scheduledAt >= :now)")
    List<LocalMeetupAd> findActiveAndNotExpired(@Param("now") LocalDateTime now);
}
