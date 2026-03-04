package com.xfrizon.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "manual_payouts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualPayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "organizer_id", nullable = false)
    @JsonIgnoreProperties({"password", "events", "tickets", "blogs", "manualPayouts"})
    private User organizer;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 10)
    @Default
    private String currency = "USD"; // Currency code (NGN, USD, etc.)

    @Column(nullable = false, length = 500)
    private String description;

    @Column(length = 500)
    private String bankDetails; // Bank account or mobile money details

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayoutStatus status = PayoutStatus.PENDING; // PENDING, SENT, FAILED, CANCELLED

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt; // When admin marked as sent

    @Column(name = "admin_notes", length = 500)
    private String adminNotes; // Admin can add notes about the payout

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum PayoutStatus {
        PENDING,   // Waiting for admin to process
        SENT,      // Admin marked as sent
        FAILED,    // Payout failed
        CANCELLED  // Cancelled by admin
    }
}
