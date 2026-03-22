package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_records", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_event_id", columnList = "event_id"),
    @Index(name = "idx_stripe_intent_id", columnList = "stripe_intent_id"),
    @Index(name = "idx_payment_status", columnList = "status"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, unique = true)
    private String stripeIntentId;

    @Column(nullable = false)
    private BigDecimal amount;

    // Amount breakdown (major units)
    @Column(name = "subtotal_amount", columnDefinition = "DECIMAL(19,2)")
    private BigDecimal subtotalAmount;

    @Column(name = "service_fee_amount", columnDefinition = "DECIMAL(19,2)")
    private BigDecimal serviceFeeAmount;

    @Column(name = "organizer_amount", columnDefinition = "DECIMAL(19,2)")
    private BigDecimal organizerAmount;

    // Cumulative refunded amount in major units (e.g., USD), updated from Stripe webhooks
    @Column(name = "refunded_amount", columnDefinition = "DECIMAL(19,2)")
    private BigDecimal refundedAmount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    private String stripeChargeId;

    private String paymentDescription;

    private String failureReason;

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

    public enum PaymentStatus {
        PENDING,
        SUCCEEDED,
        FAILED,
        CANCELLED,
        REFUNDED
    }

    public enum PaymentMethod {
        CARD,
        BANK_TRANSFER,
        WALLET,
        OTHER
    }
}
