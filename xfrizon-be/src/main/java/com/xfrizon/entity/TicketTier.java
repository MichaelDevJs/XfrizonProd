package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_tiers", indexes = {
    @Index(name = "idx_event_id", columnList = "event_id"),
    @Index(name = "idx_tier_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private String ticketType;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private BigDecimal price;

    private Integer quantity;

    private Integer quantitySold = 0;

    private Integer maxPerPerson = 1;

    @Column(name = "sale_starts_at")
    private LocalDateTime saleStartsAt;

    @Column(name = "sale_ends_at")
    private LocalDateTime saleEndsAt;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TicketStatus status = TicketStatus.ACTIVE;

    private String description;

    private Integer displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TicketStatus {
        ACTIVE,
        SOLD_OUT,
        ENDED,
        INACTIVE
    }
}
