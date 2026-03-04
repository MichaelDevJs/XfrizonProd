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
public class ManualPayoutResponse {

    private Long id;
    private Long organizerId;
    private String organizerName;
    private String organizerEmail;
    private BigDecimal amount;
    private String description;
    private String bankDetails;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    private String adminNotes;
    
    // Bank details from User entity
    private String bankName;
    private String accountHolderName;
    private String iban;
    private String bicSwift;
    private String bankCountry;
    private String accountNumber;
}
