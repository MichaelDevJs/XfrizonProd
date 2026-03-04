package com.xfrizon.service;

import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.AccountLinkCreateParams;
import com.stripe.param.AccountUpdateParams;
import com.xfrizon.dto.StripeConnectOnboardingResponse;
import com.xfrizon.entity.User;
import com.xfrizon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor
public class StripeConnectService {

    private final UserRepository userRepository;

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${xfrizon.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${xfrizon.stripe.connect.country:US}")
    private String stripeConnectCountry;

    @jakarta.annotation.PostConstruct
    private void initStripe() {
        if (stripeApiKey != null && !stripeApiKey.isEmpty()) {
            com.stripe.Stripe.apiKey = stripeApiKey;
        }
    }

    /**
     * Create a Stripe Express Connected Account for an organizer
     */
    public StripeConnectOnboardingResponse createConnectedAccount(Long organizerId) {
        try {
            User organizer = userRepository.findById(organizerId)
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            if (!organizer.getRole().equals(User.UserRole.ORGANIZER)) {
                throw new IllegalArgumentException("User is not an organizer");
            }

            // Determine country from organizer's profile, fallback to config, then US
            String detectedCountry = determineOrganizerCountry(organizer);
            String configuredCountry = detectedCountry != null ? detectedCountry 
                : ((stripeConnectCountry == null || stripeConnectCountry.isBlank()) 
                    ? "US" 
                    : stripeConnectCountry.trim().toUpperCase());

            // Check if organizer already has a connected account
            if (organizer.getStripeAccountId() != null && !organizer.getStripeAccountId().isBlank()) {
                try {
                    Account existingAccount = Account.retrieve(organizer.getStripeAccountId());
                    String existingCountry = existingAccount.getCountry();
                    
                    log.info("Organizer {} has existing Stripe account: {} (country: {})", 
                        organizerId, organizer.getStripeAccountId(), existingCountry);
                    
                    // If the country matches, return existing status
                    if (existingCountry != null && existingCountry.equalsIgnoreCase(configuredCountry)) {
                        log.info("Existing Stripe account country {} matches detected country {}", 
                            existingCountry, configuredCountry);
                        return getConnectStatus(organizerId);
                    } else {
                        // Country mismatch - need to create new account
                        log.warn("Stripe account country {} does NOT match detected country {} for organizer {}. Creating new account.",
                            existingCountry, configuredCountry, organizerId);
                        // Clear the old account and create a new one
                        organizer.setStripeAccountId(null);
                    }
                } catch (StripeException e) {
                    log.warn("Failed to retrieve existing Stripe account for organizer {}: {}. Will create new one.",
                        organizerId, e.getMessage());
                    // If we can't retrieve the account, clear it and create a new one
                    organizer.setStripeAccountId(null);
                }
            }

            // Create Express account with business profile information
            AccountCreateParams.BusinessProfile businessProfile = AccountCreateParams.BusinessProfile.builder()
                    .setUrl("https://xfrizon.com") // Platform URL
                    .setProductDescription("Ticket sales platform for events and experiences")
                    .build();

                log.info("Creating Stripe account for organizer {} in country: {} (detected from profile: {})",
                    organizerId, configuredCountry, detectedCountry != null);

                AccountCreateParams params = AccountCreateParams.builder()
                    .setType(AccountCreateParams.Type.EXPRESS)
                    .setCountry(configuredCountry)
                    .setEmail(organizer.getEmail())
                    .setBusinessProfile(businessProfile)
                    .setCapabilities(AccountCreateParams.Capabilities.builder()
                            .setCardPayments(AccountCreateParams.Capabilities.CardPayments.builder().setRequested(true).build())
                            .setTransfers(AccountCreateParams.Capabilities.Transfers.builder().setRequested(true).build())
                            .build())
                    .putMetadata("organizer_id", organizerId.toString())
                    .putMetadata("organizer_name", organizer.getName() != null ? organizer.getName() : "Organizer")
                    .build();

                Account account;
                try {
                account = Account.create(params);
                } catch (StripeException e) {
                if ("country_unsupported".equalsIgnoreCase(e.getCode()) && !"US".equals(configuredCountry)) {
                    log.warn("Configured Stripe country {} is unsupported, retrying with US for organizer {}",
                        configuredCountry, organizerId);
                    AccountCreateParams fallbackParams = AccountCreateParams.builder()
                        .setType(AccountCreateParams.Type.EXPRESS)
                        .setCountry("US")
                        .setEmail(organizer.getEmail())
                        .setBusinessProfile(businessProfile)
                        .setCapabilities(AccountCreateParams.Capabilities.builder()
                                .setCardPayments(AccountCreateParams.Capabilities.CardPayments.builder().setRequested(true).build())
                                .setTransfers(AccountCreateParams.Capabilities.Transfers.builder().setRequested(true).build())
                                .build())
                        .putMetadata("organizer_id", organizerId.toString())
                        .putMetadata("organizer_name", organizer.getName() != null ? organizer.getName() : "Organizer")
                        .build();
                    account = Account.create(fallbackParams);
                } else {
                    throw e;
                }
                }
            String accountId = account.getId();

            log.info("Created Stripe Express account {} for organizer {}", accountId, organizerId);

            // Save the connected account ID to organizer
            organizer.setStripeAccountId(accountId);
            organizer.setPayoutCadence(User.PayoutCadence.WEEKLY); // Default to weekly
            userRepository.save(organizer);

            log.info("Persisted Stripe account {} to database for organizer {}", accountId, organizerId);

            return StripeConnectOnboardingResponse.builder()
                    .organizerId(organizerId.toString())
                    .organizerName(organizer.getName())
                    .stripeAccountId(accountId)
                    .status("pending")
                    .chargesEnabled(false)
                    .payoutsEnabled(false)
                    .payoutCadence("WEEKLY")
                    .message("Connected account created. Complete onboarding to start receiving payments.")
                    .build();

        } catch (StripeException e) {
            log.error("Stripe error creating connected account for organizer {}: CODE={} MSG={}", 
                    organizerId, e.getCode(), e.getMessage(), e);
            throw new RuntimeException("Stripe error: " + e.getCode() + " - " + e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for organizer {}: {}", organizerId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error creating connected account for organizer {}: {}", 
                    organizerId, e.getMessage(), e);
            throw new RuntimeException("Error creating connected account: " + e.getMessage());
        }
    }

    /**
     * Get onboarding link for organizer to complete Stripe Connect setup
     */
    public StripeConnectOnboardingResponse getOnboardingLink(Long organizerId) {
        try {
            // Check if Stripe is initialized
            if (com.stripe.Stripe.apiKey == null || com.stripe.Stripe.apiKey.isBlank()) {
                log.error("Stripe API key is not configured");
                throw new RuntimeException("Stripe API key is not configured. Please contact administrator.");
            }

            User organizer = userRepository.findById(organizerId)
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            // IMPORTANT: First ensure we have correct account with correct country
            // This will create a new account if country has changed
            StripeConnectOnboardingResponse createResponse = createConnectedAccount(organizerId);
            
            // Reload organizer to get potentially updated stripe account ID
            organizer = userRepository.findById(organizerId)
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            String accountId = organizer.getStripeAccountId();
            if (accountId == null || accountId.isBlank()) {
                throw new RuntimeException("Failed to create or retrieve Stripe account for organizer");
            }

            // Create account link for onboarding
            AccountLinkCreateParams params = AccountLinkCreateParams.builder()
                    .setAccount(accountId)
                    .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                    .setRefreshUrl(frontendUrl + "/organizer/stripe/refresh")
                    .setReturnUrl(frontendUrl + "/organizer/stripe/success")
                    .build();

            log.debug("Creating AccountLink with params: account={}, refreshUrl={}, returnUrl={}", 
                    accountId, frontendUrl + "/organizer/stripe/refresh", frontendUrl + "/organizer/stripe/success");

            AccountLink accountLink;
            try {
                accountLink = AccountLink.create(params);
            } catch (StripeException e) {
                String message = e.getMessage() == null ? "" : e.getMessage().toLowerCase();
                boolean capabilityError = message.contains("must provide an account with capabilities")
                        || "parameter_missing".equalsIgnoreCase(e.getCode());
                if (capabilityError) {
                    log.warn("Account {} missing capabilities for onboarding, updating capabilities and retrying once", accountId);
                    ensureCapabilitiesForOnboarding(accountId);
                    accountLink = AccountLink.create(params);
                } else {
                    throw e;
                }
            }

            log.info("Generated onboarding link for organizer {} (account: {})", organizerId, accountId);

            return StripeConnectOnboardingResponse.builder()
                    .organizerId(organizerId.toString())
                    .organizerName(organizer.getName())
                    .stripeAccountId(accountId)
                    .onboardingUrl(accountLink.getUrl())
                    .status("pending")
                    .message("Visit the onboarding URL to complete account setup.")
                    .build();

        } catch (IllegalArgumentException e) {
            log.error("Invalid request for organizer {}: {}", organizerId, e.getMessage());
            throw e;
        } catch (StripeException e) {
            log.error("Stripe API error for organizer {}: CODE={} MSG={}", organizerId, e.getCode(), e.getMessage(), e);
            // Return detailed error info for frontend
            throw new RuntimeException(e.getCode() + ": " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error generating onboarding link for organizer {}: {}", organizerId, e.getMessage(), e);
            throw new RuntimeException("Error generating onboarding link: " + e.getMessage());
        }
    }

    private void ensureCapabilitiesForOnboarding(String accountId) throws StripeException {
        AccountUpdateParams updateParams = AccountUpdateParams.builder()
                .setCapabilities(AccountUpdateParams.Capabilities.builder()
                        .setCardPayments(AccountUpdateParams.Capabilities.CardPayments.builder().setRequested(true).build())
                        .setTransfers(AccountUpdateParams.Capabilities.Transfers.builder().setRequested(true).build())
                        .build())
                .build();
        Account account = Account.retrieve(accountId);
        account.update(updateParams);
    }

    /**
     * Check if organizer's Stripe Connect account is fully onboarded
     */
    public StripeConnectOnboardingResponse getConnectStatus(Long organizerId) {
        try {
            User organizer = userRepository.findById(organizerId)
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            String accountId = organizer.getStripeAccountId();
            boolean chargesEnabled = false;
            boolean payoutsEnabled = false;
            String status = "not_started";

            if (accountId != null && !accountId.isBlank()) {
                try {
                    Account account = Account.retrieve(accountId);
                    chargesEnabled = account.getChargesEnabled() != null && account.getChargesEnabled();
                    payoutsEnabled = account.getPayoutsEnabled() != null && account.getPayoutsEnabled();

                    if (payoutsEnabled) {
                        status = "completed";
                    } else if (chargesEnabled || account.getDetailsSubmitted() != null && account.getDetailsSubmitted()) {
                        status = "pending";
                    } else {
                        status = "pending";
                    }

                    log.info("Organizer {} (account: {}) - chargesEnabled: {}, payoutsEnabled: {}", 
                            organizerId, accountId, chargesEnabled, payoutsEnabled);
                } catch (StripeException e) {
                    log.warn("Failed to retrieve Stripe account {} for organizer {}: {}", 
                            accountId, organizerId, e.getMessage());
                    status = "pending";
                }
            }

            return StripeConnectOnboardingResponse.builder()
                    .organizerId(organizerId.toString())
                    .organizerName(organizer.getName())
                    .stripeAccountId(accountId)
                    .status(status)
                    .chargesEnabled(chargesEnabled)
                    .payoutsEnabled(payoutsEnabled)
                    .payoutCadence(organizer.getPayoutCadence() != null ? 
                        organizer.getPayoutCadence().toString() : "WEEKLY")
                    .message(payoutsEnabled ? "Account ready to receive payouts" : 
                        "Complete onboarding to receive payouts")
                    .build();

        } catch (IllegalArgumentException e) {
            log.error("Invalid organizer: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error checking connect status", e);
            throw new RuntimeException("Error checking connect status: " + e.getMessage());
        }
    }

    /**
     * Determine organizer's country from their profile
     * Checks bankCountry first, then location field
     * Returns 2-letter ISO country code or null if not determinable
     */
    private String determineOrganizerCountry(User organizer) {
        // Priority 1: Bank country (if they've set up manual payout info)
        if (organizer.getBankCountry() != null && !organizer.getBankCountry().isBlank()) {
            String countryCode = extractCountryCode(organizer.getBankCountry());
            if (countryCode != null) {
                log.debug("Using bank country '{}' for organizer {}", countryCode, organizer.getId());
                return countryCode;
            }
        }
        
        // Priority 2: Location field
        if (organizer.getLocation() != null && !organizer.getLocation().isBlank()) {
            String countryCode = extractCountryCode(organizer.getLocation());
            if (countryCode != null) {
                log.debug("Using location '{}' for organizer {}", countryCode, organizer.getId());
                return countryCode;
            }
        }
        
        log.debug("Could not determine country from organizer {} profile", organizer.getId());
        return null;
    }
    
    /**
     * Extract 2-letter ISO country code from location string
     * Supports common country names and codes
     */
    private String extractCountryCode(String location) {
        if (location == null || location.isBlank()) {
            return null;
        }
        
        String normalized = location.trim().toUpperCase();
        
        // Direct 2-letter ISO codes
        if (normalized.length() == 2) {
            return normalized;
        }
        
        // Common country mappings
        if (normalized.contains("GERMANY") || normalized.contains("DEUTSCHLAND")) return "DE";
        if (normalized.contains("FRANCE")) return "FR";
        if (normalized.contains("UNITED KINGDOM") || normalized.contains("UK") || normalized.equals("BRITAIN")) return "GB";
        if (normalized.contains("SPAIN") || normalized.contains("ESPAÑA")) return "ES";
        if (normalized.contains("ITALY") || normalized.contains("ITALIA")) return "IT";
        if (normalized.contains("NETHERLANDS") || normalized.contains("HOLLAND")) return "NL";
        if (normalized.contains("BELGIUM") || normalized.contains("BELGIQUE")) return "BE";
        if (normalized.contains("AUSTRIA") || normalized.contains("ÖSTERREICH")) return "AT";
        if (normalized.contains("SWITZERLAND") || normalized.contains("SCHWEIZ")) return "CH";
        if (normalized.contains("PORTUGAL")) return "PT";
        if (normalized.contains("POLAND") || normalized.contains("POLSKA")) return "PL";
        if (normalized.contains("SWEDEN") || normalized.contains("SVERIGE")) return "SE";
        if (normalized.contains("DENMARK") || normalized.contains("DANMARK")) return "DK";
        if (normalized.contains("NORWAY") || normalized.contains("NORGE")) return "NO";
        if (normalized.contains("FINLAND") || normalized.contains("SUOMI")) return "FI";
        if (normalized.contains("IRELAND")) return "IE";
        if (normalized.contains("UNITED STATES") || normalized.contains("USA") || normalized.equals("US")) return "US";
        if (normalized.contains("CANADA")) return "CA";
        if (normalized.contains("AUSTRALIA")) return "AU";
        if (normalized.contains("NEW ZEALAND")) return "NZ";
        if (normalized.contains("SOUTH AFRICA")) return "ZA";
        if (normalized.contains("NIGERIA")) return "NG";
        if (normalized.contains("KENYA")) return "KE";
        if (normalized.contains("GHANA")) return "GH";
        if (normalized.contains("INDIA")) return "IN";
        if (normalized.contains("SINGAPORE")) return "SG";
        if (normalized.contains("JAPAN")) return "JP";
        if (normalized.contains("CHINA")) return "CN";
        
        return null;
    }

    /**
     * Update organizer's payout cadence (WEEKLY or MONTHLY)
     */
    public StripeConnectOnboardingResponse updatePayoutCadence(Long organizerId, String cadence) {
        try {
            User organizer = userRepository.findById(organizerId)
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            User.PayoutCadence newCadence;
            try {
                newCadence = User.PayoutCadence.valueOf(cadence.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid payout cadence. Must be WEEKLY or MONTHLY.");
            }

            organizer.setPayoutCadence(newCadence);
            userRepository.save(organizer);

            log.info("Updated payout cadence for organizer {} to {}", organizerId, newCadence);

            // Return updated status
            return getConnectStatus(organizerId);

        } catch (Exception e) {
            log.error("Error updating payout cadence", e);
            throw new RuntimeException("Error updating payout cadence: " + e.getMessage());
        }
    }

    /**
     * Retrieve Stripe verification information for admin review
     * This allows Xfrizon admins to verify organizers based on Stripe's KYC data
     * Accessed via the Stripe API, not stored in Xfrizon database for security
     */
    public com.xfrizon.dto.StripeVerificationResponse getStripeVerificationInfo(Long organizerId) {
        try {
            User organizer = userRepository.findById(organizerId)
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            if (!organizer.getRole().equals(User.UserRole.ORGANIZER)) {
                throw new IllegalArgumentException("User is not an organizer");
            }

            String accountId = organizer.getStripeAccountId();
            if (accountId == null || accountId.isBlank()) {
                throw new IllegalArgumentException("Organizer has not set up Stripe Connect");
            }

            // Retrieve account from Stripe
            Account account = Account.retrieve(accountId);

            log.info("Retrieved Stripe verification info for organizer {} (account: {})", organizerId, accountId);

            // Build response
            com.xfrizon.dto.StripeVerificationResponse response = com.xfrizon.dto.StripeVerificationResponse.builder()
                    .stripeAccountId(accountId)
                    .organizerName(organizer.getName())
                    .email(account.getEmail())
                    .chargesEnabled(account.getChargesEnabled() != null ? account.getChargesEnabled() : false)
                    .payoutsEnabled(account.getPayoutsEnabled() != null ? account.getPayoutsEnabled() : false)
                    .country(account.getCountry())
                    .businessType(account.getType())
                    .createdTime(account.getCreated() != null ? account.getCreated() : null)
                    .accountStatus(determineAccountStatus(account))
                    .build();

            // Extract Individual/Representative info if available
            if (account.getIndividual() != null) {
                var individual = account.getIndividual();
                response.setFirstName(individual.getFirstName());
                response.setLastName(individual.getLastName());
                response.setDateOfBirth(formatDOB(individual.getDob()));
                
                if (individual.getVerification() != null && individual.getVerification().getStatus() != null) {
                    response.setVerificationStatus(individual.getVerification().getStatus());
                }
                
                if (individual.getAddress() != null) {
                    response.setAddressLine1(individual.getAddress().getLine1());
                    response.setAddressLine2(individual.getAddress().getLine2());
                    response.setCity(individual.getAddress().getCity());
                    response.setState(individual.getAddress().getState());
                    response.setPostalCode(individual.getAddress().getPostalCode());
                }
            }

            // Extract Business/Company info if available
            if (account.getCompany() != null) {
                response.setBusinessName(account.getCompany().getName());
                if (account.getCompany().getAddress() != null) {
                    response.setAddressLine1(account.getCompany().getAddress().getLine1());
                    response.setAddressLine2(account.getCompany().getAddress().getLine2());
                    response.setCity(account.getCompany().getAddress().getCity());
                    response.setState(account.getCompany().getAddress().getState());
                    response.setPostalCode(account.getCompany().getAddress().getPostalCode());
                }
            }

            // Extract Verification Requirements
            if (account.getRequirements() != null) {
                if (account.getRequirements().getPastDue() != null) {
                    response.setRequiredDocuments(new java.util.ArrayList<>(account.getRequirements().getPastDue()));
                }
            }

            log.info("Verification info retrieved for organizer {}: status={}, chargesEnabled={}, payoutsEnabled={}", 
                organizerId, response.getVerificationStatus(), response.getChargesEnabled(), response.getPayoutsEnabled());

            return response;

        } catch (StripeException e) {
            log.error("Stripe API error retrieving verification info for organizer {}: CODE={} MSG={}", 
                organizerId, e.getCode(), e.getMessage(), e);
            throw new RuntimeException("Stripe error: " + e.getCode() + " - " + e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for organizer {}: {}", organizerId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving Stripe verification info for organizer {}: {}", organizerId, e.getMessage(), e);
            throw new RuntimeException("Error retrieving verification info: " + e.getMessage());
        }
    }

    private String formatDOB(Object dob) {
        if (dob == null) return null;
        // Stripe provides DOB as a Map with year, month, day fields
        if (dob instanceof java.util.Map) {
            java.util.Map<String, Object> dobMap = (java.util.Map<String, Object>) dob;
            Integer year = (Integer) dobMap.get("year");
            Integer month = (Integer) dobMap.get("month");
            Integer day = (Integer) dobMap.get("day");
            if (year != null && month != null && day != null) {
                return String.format("%04d-%02d-%02d", year, month, day);
            }
        }
        return dob.toString();
    }

    private String determineAccountStatus(com.stripe.model.Account account) {
        if (account.getChargesEnabled() != null && account.getChargesEnabled() &&
            account.getPayoutsEnabled() != null && account.getPayoutsEnabled()) {
            return "verified";
        }
        if (account.getRequirements() != null) {
            java.util.List<String> pastDue = account.getRequirements().getPastDue();
            if (pastDue != null && !pastDue.isEmpty()) {
                return "requires_action";
            }
            java.util.List<String> currentlyDue = account.getRequirements().getCurrentlyDue();
            if (currentlyDue != null && !currentlyDue.isEmpty()) {
                return "pending_verification";
            }
        }
        return "active";
    }
}
