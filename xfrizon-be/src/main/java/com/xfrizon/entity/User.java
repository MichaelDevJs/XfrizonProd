package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private Boolean isEmailVerified = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    private String profilePicture;

    private String logo;

    private String phoneNumber;

    private String location;

    private String address;

    private String website;

    private String instagram;

    private String twitter;

    @Column(length = 500)
    private String bio;

    private String coverPhoto;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String favoriteArtists;

    @Column(columnDefinition = "JSON")
    private String media;

    // Stripe Connect (for organizer payouts)
    @Column(name = "stripe_account_id")
    private String stripeAccountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payout_cadence")
    private PayoutCadence payoutCadence = PayoutCadence.WEEKLY;

    // Flag to indicate organizer prefers manual payouts (admin-processed)
    @Column(name = "prefers_manual_payout")
    private Boolean prefersManualPayout = false;

    // Bank details for manual payouts
    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "account_holder_name")
    private String accountHolderName;

    @Column(name = "iban")
    private String iban;

    @Column(name = "bic_swift")
    private String bicSwift;

    @Column(name = "bank_country")
    private String bankCountry;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "bank_branch")
    private String bankBranch;

    @Column(name = "bank_details_verified")
    private Boolean bankDetailsVerified = false;

    // Verification status for Stripe KYC
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status")
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verified_by_admin_id")
    private Long verifiedByAdminId;

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "fraud_risk_level")
    private FraudRiskLevel fraudRiskLevel = FraudRiskLevel.LOW;

    @Column(name = "fraud_flags", columnDefinition = "TEXT")
    private String fraudFlags; // JSON array of flags

    @Column(name = "last_fraud_check_at")
    private LocalDateTime lastFraudCheckAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum UserRole {
        USER,
        ORGANIZER,
        ADMIN
    }

    public enum PayoutCadence {
        WEEKLY,
        MONTHLY
    }

    public enum VerificationStatus {
        UNVERIFIED,        // Not yet verified (initial state)
        PENDING,           // Waiting for Stripe KYC verification
        STRIPE_VERIFIED,   // Stripe has verified the organizer
        ADMIN_APPROVED,    // Admin has reviewed and approved
        ADMIN_REJECTED,    // Admin has rejected (fraud suspected)
        SUSPENDED          // Temporarily suspended pending review
    }

    public enum FraudRiskLevel {
        LOW,              // No suspicious activity
        MEDIUM,           // Some warning signs
        HIGH,             // Multiple fraud indicators
        CRITICAL          // Immediate action required
    }
}
