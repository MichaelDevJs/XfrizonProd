package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "points_transactions", indexes = {
    @Index(name = "idx_ptx_user_id", columnList = "user_id"),
    @Index(name = "idx_ptx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointsTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Positive = earned, negative = redeemed/reversed */
    @Column(nullable = false)
    private Integer points;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    /** "TICKET_PURCHASE", "REDEMPTION", "REVERSAL" */
    @Column(name = "source_type", length = 50)
    private String sourceType;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(length = 255)
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void setCreatedAt() {
        this.createdAt = LocalDateTime.now();
    }

    public enum TransactionType {
        EARNED, REDEEMED, REVERSED
    }
}
