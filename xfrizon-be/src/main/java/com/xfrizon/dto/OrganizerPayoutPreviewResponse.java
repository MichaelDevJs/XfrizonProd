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
public class OrganizerPayoutPreviewResponse {
    private Long organizerId;
    private String organizerName;
    private String organizerEmail;
    private String cadence;
    private LocalDateTime windowStart;
    private LocalDateTime windowEnd;
    private String currency;
    private BigDecimal grossRevenue;
    private BigDecimal serviceFeeTotal;
    private BigDecimal totalEarnedByOrganizer;
    private BigDecimal alreadySentAmount;
    private BigDecimal pendingManualAmount;
    private BigDecimal availableToSend;
    private Long successfulPaymentsCount;
    private LocalDateTime lastPaymentAt;
}