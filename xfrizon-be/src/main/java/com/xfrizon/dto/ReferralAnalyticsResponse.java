package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReferralAnalyticsResponse {

    private LocalDate fromDate;
    private LocalDate toDate;
    private Long totalSignups;
    private Long totalTicketPurchases;
    private Long totalConversions;
    private Long uniqueReferrers;
    private List<ReferrerStats> topReferrers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReferrerStats {
        private Long referrerUserId;
        private String referrerName;
        private String referrerEmail;
        private Long signupConversions;
        private Long ticketPurchaseConversions;
        private Long totalConversions;
    }
}