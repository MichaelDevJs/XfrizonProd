package com.xfrizon.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketPurchaseRequest {

    @JsonProperty("event_id")
    @JsonAlias("eventId")
    private Long eventId;

    @JsonProperty("ticket_id")
    @JsonAlias("ticketTierId")
    private Long ticketId;

    private Integer quantity;

    @JsonProperty("payment_intent_id")
    @JsonAlias("paymentIntentId")
    private String paymentIntentId;

    @JsonProperty("total_price")
    @JsonAlias("totalPrice")
    private BigDecimal totalPrice;

    @JsonProperty("subtotal_price")
    @JsonAlias({"subtotalPrice", "subtotal"})
    private BigDecimal subtotalPrice;

    @JsonProperty("service_fee")
    @JsonAlias({"serviceFee", "service_fee"})
    private BigDecimal serviceFee;

    @JsonProperty("currency")
    private String currency;

    @JsonProperty("referral_code")
    @JsonAlias({"referralCode", "ref"})
    private String referralCode;
}
