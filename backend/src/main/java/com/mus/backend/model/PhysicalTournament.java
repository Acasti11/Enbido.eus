package com.mus.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "physical_tournament")
@Data
public class PhysicalTournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tournament_id")
    @JsonProperty("id")
    private Long tournamentId;

    @Column(name = "organizer_id")
    private Long organizerId;

    @Column(name = "title", nullable = false)
    @JsonProperty("tournamentName")
    private String title;

    @Column(name = "city")
    private String city = "N/A";

    @Column(name = "specific_location")
    @JsonProperty("tournamentLocation")
    private String specificLocation;

    @Column(name = "start_datetime")
    private LocalDateTime startDatetime;

    @Transient
    @JsonProperty("tournamentDate")
    private String tournamentDate;

    @Transient
    @JsonProperty("tournamentTime")
    private String tournamentTime;

    @Column(name = "entry_fee")
    @JsonProperty("inscriptionPrice")
    private Double entryFee;

    @Column(name = "max_teams")
    @JsonProperty("maxParticipants")
    private Integer maxTeams;

    @Column(name = "status")
    private String status = "open";

    @Column(name = "contact_email")
    @JsonProperty("contactEmail")
    private String contactEmail;
    
    @Column(name = "structure")
    @JsonProperty("tournamentStructure")
    private String structure;
    
    @Column(name = "prizes")
    @JsonProperty("tournamentPrizes")
    private String prizes;
    
    @Column(name = "other_details")
    @JsonProperty("otherDetails")
    private String otherDetails;
    
    @Column(name = "poster_image", columnDefinition = "LONGTEXT")
    @JsonProperty("posterImage")
    private String posterImage;

    @PrePersist
    @PreUpdate
    public void convertDates() {
        if (this.tournamentDate != null && this.tournamentTime != null) {
            try {
                this.startDatetime = LocalDateTime.parse(this.tournamentDate + "T" + (this.tournamentTime.length() == 5 ? this.tournamentTime + ":00" : this.tournamentTime));
            } catch(Exception e) {}
        }
    }
    
    @PostLoad
    public void fillTransients() {
        if (this.startDatetime != null) {
            this.tournamentDate = this.startDatetime.toLocalDate().toString();
            this.tournamentTime = this.startDatetime.toLocalTime().toString();
        }
    }
}
