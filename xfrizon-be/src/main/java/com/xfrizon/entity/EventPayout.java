package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "event_payouts",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_event_payout_event_currency", columnNames = {"event_id", "currency"})
    },
    indexes = {
        @Index(name = "idx_event_payout_release_at", columnList = "release_at"),
        @Index(name = "idx_event_payout_status", columnList = "status"),
        @Index(name = "idx_event_payout_organizer", columnList = "organizer_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventPayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "gross_revenue", nullable = false, precision = 19, scale = 2)
    private BigDecimal grossRevenue;

    @Column(name = "service_fee_total", nullable = false, precision = 19, scale = 2)
    private BigDecimal serviceFeeTotal;

    @Column(name = "net_payout", nullable = false, precision = 19, scale = 2)
    private BigDecimal netPayout;

    @Column(name = "successful_payments_count", nullable = false)
    private Long successfulPaymentsCount;

    @Column(name = "last_payment_at")
    private LocalDateTime lastPaymentAt;

    @Column(name = "event_end_at", nullable = false)
    private LocalDateTime eventEndAt;

    @Column(name = "release_at", nullable = false)
    private LocalDateTime releaseAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayoutStatus status;

    @Column(name = "admin_hold", nullable = false)
    private Boolean adminHold;

    @Column(name = "hold_reason", length = 500)
    private String holdReason;

    @Column(name = "stripe_transfer_id")
    private String stripeTransferId;

    @Column(name = "failure_reason", length = 1000)
    private String failureReason;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (adminHold == null) {
            adminHold = false;
        }
        if (status == null) {
            status = PayoutStatus.SCHEDULED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum PayoutStatus {
        SCHEDULED,
        READY,
        HELD,
        PAID,
        FAILED
    }
}
