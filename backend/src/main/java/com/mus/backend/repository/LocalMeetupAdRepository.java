package com.mus.backend.repository;

import com.mus.backend.model.LocalMeetupAd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocalMeetupAdRepository extends JpaRepository<LocalMeetupAd, Long> {
    List<LocalMeetupAd> findByIsActiveTrue();
}
