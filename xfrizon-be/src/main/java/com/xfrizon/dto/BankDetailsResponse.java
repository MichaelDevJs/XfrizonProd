package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankDetailsResponse {

    private Long organizerId;
    private String organizerName;
    private String bankName;
    private String accountHolderName;
    private String iban;
    private String bicSwift;
    private String bankCountry;
    private String accountNumber;
    private String bankBranch;
    private Boolean bankDetailsVerified;
    private Boolean prefersManualPayout;
}
