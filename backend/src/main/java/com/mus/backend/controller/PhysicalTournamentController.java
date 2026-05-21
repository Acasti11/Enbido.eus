package com.mus.backend.controller;

import com.mus.backend.model.PhysicalTournament;
import com.mus.backend.repository.PhysicalTournamentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tournaments")
@CrossOrigin(origins = "*")
public class PhysicalTournamentController {

    @Autowired
    private PhysicalTournamentRepository tournamentRepo;

    @GetMapping
    public ResponseEntity<List<PhysicalTournament>> getAllTournaments() {
        return ResponseEntity.ok(tournamentRepo.findAllByOrderByTournamentIdDesc());
    }

    @PostMapping
    public ResponseEntity<PhysicalTournament> createTournament(@RequestBody PhysicalTournament tournament) {
        // Pre-parse the dates before saving
        tournament.convertDates();
        PhysicalTournament saved = tournamentRepo.save(tournament);
        saved.fillTransients();
        return ResponseEntity.ok(saved);
    }
}
