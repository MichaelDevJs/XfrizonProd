package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventPayoutPreviewResponse {
    private Long payoutId;
    private Long eventId;
    private String eventTitle;
    private Long organizerId;
    private String organizerName;
    private String organizerEmail;
    private String currency;
    private BigDecimal grossRevenue;
    private BigDecimal serviceFeeTotal;
    private BigDecimal netPayout;
    private Long successfulPaymentsCount;
    private LocalDateTime lastPaymentAt;
    private LocalDateTime eventEndAt;
    private LocalDateTime releaseAt;
    private String status;
    private Boolean adminHold;
    private String holdReason;
    private String stripeTransferId;
    private String failureReason;
    private LocalDateTime paidAt;
    private Boolean readyForAutoPayout;
}
