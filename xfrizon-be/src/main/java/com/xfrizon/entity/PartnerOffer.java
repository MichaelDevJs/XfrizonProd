package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "partner_offers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "partner_id", nullable = false)
    private Partner partner;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Points user must spend to redeem this offer */
    @Column(name = "points_cost", nullable = false)
    private Integer pointsCost;

    /** Discount percentage partner applies (e.g. 10, 20) */
    @Column(name = "discount_percent", nullable = false)
    private Integer discountPercent;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
