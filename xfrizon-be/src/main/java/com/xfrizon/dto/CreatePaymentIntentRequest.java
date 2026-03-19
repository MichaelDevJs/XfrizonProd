package com.xfrizon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class CreatePaymentIntentRequest {
    @NotNull(message = "Event ID is required")
    @JsonProperty("eventId")
    private Long eventId;
    
    @NotNull(message = "Amount is required")
    @JsonProperty("amount")
    private BigDecimal amount;
    
    @JsonProperty("currency")
    private String currency;
    
        @JsonProperty("organizerId")
        private Long organizerId;
    
        @JsonProperty("useStripeConnect")
        private Boolean useStripeConnect;

        @JsonProperty("referralCode")
        private String referralCode;
    
    @NotEmpty(message = "At least one ticket tier must be selected")
    @Valid
    @JsonProperty("ticketTiers")
    private List<TicketTierItem> ticketTiers;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TicketTierItem {
        @NotNull(message = "Ticket tier ID is required")
        private Long ticketTierId;
        
        @NotNull(message = "Quantity is required")
        private Integer quantity;
    }
}
