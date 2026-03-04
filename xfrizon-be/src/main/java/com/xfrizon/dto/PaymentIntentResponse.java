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
public class PaymentIntentResponse {

    @JsonProperty("client_secret")
    private String clientSecret;

    @JsonProperty("payment_intent_id")
    private String paymentIntentId;

    private String status;

    @JsonProperty("created_at")
    private Long createdAt;
}
