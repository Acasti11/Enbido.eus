package com.mus.backend.controller;

import com.mus.backend.model.PhysicalTournament;
import com.mus.backend.repository.PhysicalTournamentRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tournaments")
@CrossOrigin(origins = "*")
public class PhysicalTournamentController {

    @Autowired
    private PhysicalTournamentRepository tournamentRepository;

    @GetMapping
    public ResponseEntity<List<PhysicalTournament>> getAllTournaments() {
        return ResponseEntity.ok(tournamentRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createTournament(@RequestBody PhysicalTournament tournament, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("No autorizado: token inválido o ausente");
        }
        tournament.setOrganizerId(userId);
        tournament.setStatus("open");
        PhysicalTournament saved = tournamentRepository.save(tournament);
        return ResponseEntity.ok(saved);
    }
}
