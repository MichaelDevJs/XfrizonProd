package com.xfrizon.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RedemptionOrderResponse {
    private Long id;
    private Long partnerId;
    private String partnerName;
    private String partnerCategory;
    private String partnerType;
    private String offerTitle;
    private Integer pointsUsed;
    private Integer discountPercent;
    /** Base64-encoded QR code data URI for in-person redemption */
    private String qrCodeDataUri;
    /** Coupon code for online redemption */
    private String couponCode;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
