package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "redemption_orders", indexes = {
    @Index(name = "idx_ro_user_id", columnList = "user_id"),
    @Index(name = "idx_ro_token", columnList = "token")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedemptionOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "partner_offer_id", nullable = false)
    private PartnerOffer offer;

    @Column(name = "points_used", nullable = false)
    private Integer pointsUsed;

    @Column(name = "discount_percent", nullable = false)
    private Integer discountPercent;

    /** Unique token for QR scan verification */
    @Column(nullable = false, unique = true, length = 64)
    private String token;

    /** Coupon code for online redemption */
    @Column(name = "coupon_code", length = 20)
    private String couponCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RedemptionStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @PrePersist
    public void setCreatedAt() {
        this.createdAt = LocalDateTime.now();
    }

    public enum RedemptionStatus {
        PENDING, USED, EXPIRED
    }
}
