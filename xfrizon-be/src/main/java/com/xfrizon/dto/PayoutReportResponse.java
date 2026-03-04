package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutReportResponse {

    private Long organizerId;
    private String organizerName;
    private String currency;
    private List<PayoutWindowReport> payoutSummary;
    private PayoutTotals totals;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PayoutTotals {
        private BigDecimal totalGrossRevenue;
        private BigDecimal totalServiceFee;
        private BigDecimal totalNetForOrganizer;
        private Integer totalPaymentRecords;
        private Integer totalTicketsSold;
    }
}
