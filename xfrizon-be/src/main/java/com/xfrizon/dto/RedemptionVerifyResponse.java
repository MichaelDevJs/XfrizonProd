package com.xfrizon.dto;

import lombok.Builder;
import lombok.Data;

/** Returned when a partner scans a QR code to verify a redemption */
@Data
@Builder
public class RedemptionVerifyResponse {
    private boolean valid;
    private String message;
    private String userName;
    private String offerTitle;
    private Integer discountPercent;
    private String partnerName;
}
