package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualPayoutRequest {
    private Long organizerId;
    private BigDecimal amount;
    private String currency; // Currency code (NGN, USD, etc.)
    private String description;
    private String bankDetails; // Optional: bank account, mobile money, etc.
}
