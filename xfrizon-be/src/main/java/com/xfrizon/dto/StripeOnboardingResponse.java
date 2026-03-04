package com.xfrizon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StripeOnboardingResponse {

    @JsonProperty("stripe_account_id")
    private String stripeAccountId;

    @JsonProperty("onboarding_url")
    private String onboardingUrl;
}
