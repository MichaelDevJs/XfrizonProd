package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events", indexes = {
    @Index(name = "idx_organizer_id", columnList = "organizer_id"),
    @Index(name = "idx_event_status", columnList = "status"),
    @Index(name = "idx_event_date", columnList = "event_date_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @Column(nullable = false)
    private LocalDateTime eventDateTime;

    private LocalDateTime eventEndDate;

    @Column(nullable = false)
    private String venueName;

    @Column(nullable = false)
    private String venueAddress;

    private String venueMapLink;

    @Column(nullable = false)
    private String country;

    private String city;

    @Column(nullable = false)
    private String currency;

    private Integer ageLimit = 0;

    private Integer capacity = 0;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EventStatus status = EventStatus.DRAFT;

    private String flyerUrl;

    private String flyerBucket;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "event_genres", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "genre")
    private List<String> genres = new ArrayList<>();

    @Column(nullable = false)
    private Boolean rsvpEnabled = false;

    private Integer rsvpCapacity;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "event_rsvp_required_fields", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "field_name")
    private List<String> rsvpRequiredFields = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketTier> ticketTiers = new ArrayList<>();

    @Column(name = "total_capacity", nullable = false, columnDefinition = "DECIMAL(19,2) DEFAULT 0")
    private BigDecimal totalCapacity = BigDecimal.ZERO;

    @Column(name = "total_tickets_sold")
    private Integer totalTicketsSold = 0;

    @Column(name = "total_revenue", columnDefinition = "DECIMAL(19,2) DEFAULT 0")
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    private String cancellableReason;

    @Version
    private Long version;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        status = EventStatus.DRAFT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum EventStatus {
        DRAFT,
        PUBLISHED,
        LIVE,
        COMPLETED,
        CANCELLED,
        POSTPONED
    }
}
