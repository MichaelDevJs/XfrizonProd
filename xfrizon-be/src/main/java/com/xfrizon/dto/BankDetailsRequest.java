package com.xfrizon.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BankDetailsRequest {

    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Account holder name is required")
    private String accountHolderName;

    private String iban;

    private String bicSwift;

    private String bankCountry;

    private String accountNumber;

    private String bankBranch;

    private Boolean prefersManualPayout;
}
