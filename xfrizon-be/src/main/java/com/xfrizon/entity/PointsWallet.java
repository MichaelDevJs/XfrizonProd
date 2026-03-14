package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "points_wallets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointsWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "available_balance", nullable = false)
    @Builder.Default
    private Integer availableBalance = 0;

    @Column(name = "lifetime_earned", nullable = false)
    @Builder.Default
    private Integer lifetimeEarned = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    @PrePersist
    public void setUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }
}
