package com.xfrizon.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StripeConnectOnboardingResponse {
    
    private String organizerId;
    private String organizerName;
    private String stripeAccountId;
    private String onboardingUrl;  // The URL organizer visits to complete setup
    private String status;  // "not_started", "pending", "completed"
    private Boolean chargesEnabled;  // Can accept payments
    private Boolean payoutsEnabled;  // Can receive payouts
    private String payoutCadence;  // WEEKLY or MONTHLY
    private String message;
}
