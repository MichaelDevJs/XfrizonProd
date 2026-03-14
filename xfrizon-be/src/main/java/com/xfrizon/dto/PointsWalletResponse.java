package com.xfrizon.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PointsWalletResponse {
    private Long userId;
    private Integer availableBalance;
    private Integer lifetimeEarned;
    private String tier;       // BRONZE / SILVER / GOLD
    private Integer tierDiscount; // 10 / 15 / 20
}
