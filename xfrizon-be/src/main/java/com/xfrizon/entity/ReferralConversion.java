package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "referral_conversions", indexes = {
        @Index(name = "idx_referral_conversion_type", columnList = "conversion_type"),
        @Index(name = "idx_referral_payment_intent", columnList = "payment_intent_id"),
        @Index(name = "idx_referral_referred_user", columnList = "referred_user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReferralConversion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referrer_user_id", nullable = false)
    private User referrerUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referred_user_id", nullable = false)
    private User referredUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "conversion_type", nullable = false, length = 40)
    private ConversionType conversionType;

    @Column(name = "referral_code", length = 120)
    private String referralCode;

    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "payment_intent_id", length = 120)
    private String paymentIntentId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum ConversionType {
        SIGNUP,
        TICKET_PURCHASE
    }
}