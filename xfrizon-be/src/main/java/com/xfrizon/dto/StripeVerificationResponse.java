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
public class StripeVerificationResponse {
    
    private String stripeAccountId;
    private String organizerName;
    private String email;
    
    // Verification Status
    private String verificationStatus;  // "verified", "pending", "unverified"
    private Boolean chargesEnabled;
    private Boolean payoutsEnabled;
    
    // Individual/Representative Info
    private String firstName;
    private String lastName;
    private String dateOfBirth;
    private String ssn;  // Last 4 only, for security
    
    // Address Info
    private String country;
    private String state;
    private String city;
    private String addressLine1;
    private String addressLine2;
    private String postalCode;
    
    // Business Info
    private String businessType;  // "individual", "sole_proprietor", "partnership", "corporation", "nonprofit"
    private String businessName;
    private String taxId;
    private String taxIdType;  // "us_ssn", "eu_vat", etc.
    
    // Verification Requirements
    private java.util.List<String> requiredDocuments;  // What's still needed
    private java.util.List<String> verifiedDocuments;   // What's been verified
    
    // Additional fields
    private String accountStatus;    // "restricted", "active", etc.
    private Long createdTime;
    private Long verifiedTime;
}
