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
public class StripeConnectStatusResponse {

    @JsonProperty("stripe_account_id")
    private String stripeAccountId;

    @JsonProperty("charges_enabled")
    private boolean chargesEnabled;

    @JsonProperty("payouts_enabled")
    private boolean payoutsEnabled;

    @JsonProperty("details_submitted")
    private boolean detailsSubmitted;

    @JsonProperty("payout_cadence")
    private String payoutCadence;
}
