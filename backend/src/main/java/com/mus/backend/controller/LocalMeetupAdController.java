package com.mus.backend.controller;

import com.mus.backend.model.LocalMeetupAd;
import com.mus.backend.repository.LocalMeetupAdRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetups")
@CrossOrigin(origins = "*")
public class LocalMeetupAdController {

    @Autowired
    private LocalMeetupAdRepository meetupRepository;

    @GetMapping
    public ResponseEntity<List<LocalMeetupAd>> getAllMeetups() {
        return ResponseEntity.ok(meetupRepository.findByIsActiveTrue());
    }

    @PostMapping
    public ResponseEntity<?> createMeetup(@RequestBody LocalMeetupAd ad, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("No autorizado: token inválido o ausente");
        }
        ad.setCreatorId(userId);
        ad.setIsActive(true);
        LocalMeetupAd saved = meetupRepository.save(ad);
        return ResponseEntity.ok(saved);
    }
}
