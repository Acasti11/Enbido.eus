package com.mus.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "physical_tournament")
@Data
public class PhysicalTournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tournament_id")
    private Long tournamentId;

    @Column(name = "organizer_id")
    private Long organizerId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "city")
    private String city;

    @Column(name = "specific_location")
    private String specificLocation;

    @Column(name = "start_datetime")
    private LocalDateTime startDatetime;

    @Column(name = "entry_fee")
    private BigDecimal entryFee = BigDecimal.ZERO;

    @Column(name = "max_teams")
    private Integer maxTeams;

    @Column(name = "status")
    private String status = "open";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organizer_id", insertable = false, updatable = false)
    private Usuario organizer;
}
