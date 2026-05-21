package com.mus.backend.controller;

import com.mus.backend.model.LocalMeetupAd;
import com.mus.backend.model.Usuario;
import com.mus.backend.repository.LocalMeetupAdRepository;
import com.mus.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetups")
@CrossOrigin(origins = "*")
public class MeetupController {

    @Autowired
    private LocalMeetupAdRepository meetupRepo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @GetMapping
    public ResponseEntity<List<LocalMeetupAd>> getActiveMeetups() {
        List<LocalMeetupAd> ads = meetupRepo.findAllByIsActiveOrderByAdIdDesc(true);
        for (LocalMeetupAd ad : ads) {
            Usuario u = usuarioRepo.findById(ad.getCreatorId()).orElse(null);
            if (u != null) {
                ad.setCreatorName(u.getUsername());
            } else {
                ad.setCreatorName("Usuario Desconocido");
            }
        }
        return ResponseEntity.ok(ads);
    }

    @PostMapping
    public ResponseEntity<LocalMeetupAd> createMeetup(@RequestBody LocalMeetupAd ad) {
        LocalMeetupAd saved = meetupRepo.save(ad);
        Usuario u = usuarioRepo.findById(saved.getCreatorId()).orElse(null);
        if (u != null) {
            saved.setCreatorName(u.getUsername());
        } else {
            saved.setCreatorName("Usuario Desconocido");
        }
        return ResponseEntity.ok(saved);
    }
}
