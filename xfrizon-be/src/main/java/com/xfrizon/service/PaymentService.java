package com.xfrizon.service;

import com.stripe.exception.StripeException;
import com.stripe.exception.CardException;
import com.stripe.exception.AuthenticationException;
import com.stripe.exception.RateLimitException;
import com.stripe.exception.InvalidRequestException;
import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Account;
import com.stripe.param.AccountUpdateParams;
import com.stripe.param.CustomerListParams;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.xfrizon.dto.CreatePaymentIntentRequest;
import com.xfrizon.dto.PaymentIntentResponse;
import com.xfrizon.entity.Event;
import com.xfrizon.entity.PaymentRecord;
import com.xfrizon.entity.TicketTier;
import com.xfrizon.entity.User;
import com.xfrizon.repository.EventRepository;
import com.xfrizon.repository.PaymentRecordRepository;
import com.xfrizon.repository.TicketTierRepository;
import com.xfrizon.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@Transactional
public class PaymentService {

    private final PaymentRecordRepository paymentRecordRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final TicketTierRepository ticketTierRepository;
    private final TicketService ticketService;

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${xfrizon.service-fee-rate:0.10}")
    private BigDecimal serviceFeeRate;

    // Stripe minimum amount per currency (in smallest unit)
    // 50 cents minimum globally; amounts vary by currency
    private static final Map<String, Long> CURRENCY_MINIMUMS = new HashMap<String, Long>() {{
        put("ngn", 20000L);    // ~$0.25 USD
        put("kes", 100L);      // ~$0.25 USD
        put("zar", 10L);       // ~$0.25 USD
        put("ghs", 2L);        // ~$0.25 USD
        put("ugx", 1000L);     // ~$0.25 USD
        put("gbp", 40L);       // ~40 pence
        put("eur", 50L);       // 50 cents
        put("usd", 50L);       // 50 cents
        put("aud", 75L);       // ~50 cents
        put("cad", 70L);       // ~50 cents
        put("inr", 50L);       // ~50 cents
        put("jpy", 50L);       // ~50 cents
        put("chf", 50L);       // 50 cents
        put("sek", 50L);       // ~50 cents
        put("nzd", 80L);       // ~50 cents
    }};

    public PaymentService(
            PaymentRecordRepository paymentRecordRepository,
            UserRepository userRepository,
            EventRepository eventRepository,
            TicketTierRepository ticketTierRepository,
            TicketService ticketService) {
        this.paymentRecordRepository = paymentRecordRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.ticketTierRepository = ticketTierRepository;
        this.ticketService = ticketService;
    }

    @jakarta.annotation.PostConstruct
    private void initStripe() {
        if (stripeApiKey != null && !stripeApiKey.isEmpty()) {
            com.stripe.Stripe.apiKey = stripeApiKey;
        }
    }

    /**
     * Create a Stripe PaymentIntent for ticket purchase (supports multiple ticket tiers)
     */
    public PaymentIntentResponse createPaymentIntent(Long userId, CreatePaymentIntentRequest request) {
        try {
            log.info("Creating payment intent for user: {}, event: {}, amount: {}", 
                    userId, request.getEventId(), request.getAmount());

            if (!isStripeConfigured()) {
                throw new IllegalStateException("Payment service is not configured. Missing STRIPE_API_KEY.");
            }

            // Validate inputs
            if (request.getEventId() == null || request.getEventId() <= 0) {
                throw new IllegalArgumentException("Invalid event ID");
            }
            if (request.getTicketTiers() == null || request.getTicketTiers().isEmpty()) {
                throw new IllegalArgumentException("At least one ticket tier must be selected");
            }
            // Amount is computed server-side; do not trust client-provided totals.

            // Validate user and event exist
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            Event event = eventRepository.findById(request.getEventId())
                    .orElseThrow(() -> new IllegalArgumentException("Event not found"));

            User organizer = event.getOrganizer();
            if (organizer == null) {
                throw new IllegalArgumentException("Event has no organizer");
            }

            String organizerStripeAccountId = organizer.getStripeAccountId();
            Boolean prefersManualPayout = organizer.getPrefersManualPayout() != null && organizer.getPrefersManualPayout();
            
            // Validate that organizer has configured payout method
            if ((organizerStripeAccountId == null || organizerStripeAccountId.isBlank()) && !prefersManualPayout) {
                throw new IllegalArgumentException(
                    "Organizer has not configured payout method. Please complete Stripe setup or choose manual payouts.");
            }

            // Validate all ticket tiers and compute authoritative amounts (major units)
            StringBuilder ticketDescription = new StringBuilder();
            BigDecimal subtotalMajor = BigDecimal.ZERO;
            for (CreatePaymentIntentRequest.TicketTierItem tierItem : request.getTicketTiers()) {
                TicketTier ticketTier = ticketTierRepository.findById(tierItem.getTicketTierId())
                        .orElseThrow(() -> new IllegalArgumentException("Ticket tier not found: " + tierItem.getTicketTierId()));

                // Validate ticket tier belongs to event
                if (!ticketTier.getEvent().getId().equals(event.getId())) {
                    throw new IllegalArgumentException("Ticket tier does not belong to this event");
                }

                LocalDateTime now = LocalDateTime.now();
                if (ticketTier.getSaleStartsAt() != null && now.isBefore(ticketTier.getSaleStartsAt())) {
                    throw new IllegalArgumentException("Ticket sales have not started yet for " + ticketTier.getTicketType());
                }
                if (ticketTier.getSaleEndsAt() != null && now.isAfter(ticketTier.getSaleEndsAt())) {
                    throw new IllegalArgumentException("Ticket sales have ended for " + ticketTier.getTicketType());
                }

                // Validate quantity available
                Integer availableQuantity = ticketTier.getQuantity() - ticketTier.getQuantitySold();
                if (availableQuantity < tierItem.getQuantity()) {
                    throw new IllegalArgumentException("Not enough tickets available for " + ticketTier.getTicketType());
                }

                // Build description
                if (ticketDescription.length() > 0) {
                    ticketDescription.append(", ");
                }
                ticketDescription.append(tierItem.getQuantity()).append("x ").append(ticketTier.getTicketType());

                BigDecimal unitPrice = ticketTier.getPrice() != null ? ticketTier.getPrice() : BigDecimal.ZERO;
                BigDecimal qty = BigDecimal.valueOf(tierItem.getQuantity() != null ? tierItem.getQuantity() : 0);
                subtotalMajor = subtotalMajor.add(unitPrice.multiply(qty));
            }

            subtotalMajor = subtotalMajor.setScale(2, RoundingMode.HALF_UP);
            BigDecimal serviceFeeMajor = subtotalMajor.multiply(serviceFeeRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalMajor = subtotalMajor.add(serviceFeeMajor).setScale(2, RoundingMode.HALF_UP);
            // Organizer receives the ticket subtotal. XF retains the customer-paid service fee.
            BigDecimal organizerMajor = subtotalMajor.setScale(2, RoundingMode.HALF_UP);

            // Validate currency and check minimum amount
            String currency = request.getCurrency() != null ? request.getCurrency().toLowerCase() : "ngn";
            Long amountInSmallestUnit = totalMajor.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
            Long minimumAmount = CURRENCY_MINIMUMS.getOrDefault(currency, 50L);
            
            if (amountInSmallestUnit < minimumAmount) {
                String errorMsg = String.format(
                    "Amount too small for %s. Minimum required: %d %s (you provided: %d %s)",
                    currency.toUpperCase(),
                    minimumAmount,
                    currency.toUpperCase(),
                    amountInSmallestUnit,
                    currency.toUpperCase()
                );
                log.warn("Payment amount validation failed: {}", errorMsg);
                throw new IllegalArgumentException(errorMsg);
            }

            // Create Stripe PaymentIntent
                String stripeCustomerId = findOrCreateStripeCustomer(user);

            PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                    .setAmount(amountInSmallestUnit)
                    .setCurrency(currency)
                    .setCustomer(stripeCustomerId)
                    .setReceiptEmail(user.getEmail())
                    .setSetupFutureUsage(PaymentIntentCreateParams.SetupFutureUsage.OFF_SESSION)
                    .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                            .setEnabled(true)
                            .setAllowRedirects(
                                PaymentIntentCreateParams.AutomaticPaymentMethods.AllowRedirects.ALWAYS)
                            .build())
                    .setDescription("Ticket purchase for: " + event.getTitle() + " - " + ticketDescription)
                    .putMetadata("user_id", userId.toString())
                    .putMetadata("event_id", request.getEventId().toString())
                    .putMetadata("event_title", event.getTitle())
                    .putMetadata("subtotal_major", subtotalMajor.toPlainString())
                    .putMetadata("service_fee_major", serviceFeeMajor.toPlainString())
                    .putMetadata("total_major", totalMajor.toPlainString())
                    .putMetadata("organizer_id", organizer.getId().toString());

            if (request.getReferralCode() != null && !request.getReferralCode().isBlank()) {
                paramsBuilder.putMetadata("referral_code", request.getReferralCode().trim());
            }

            for (CreatePaymentIntentRequest.TicketTierItem tierItem : request.getTicketTiers()) {
                if (tierItem == null || tierItem.getTicketTierId() == null || tierItem.getQuantity() == null) {
                    continue;
                }
                if (tierItem.getQuantity() <= 0) {
                    continue;
                }
                paramsBuilder.putMetadata(
                        "tier_" + tierItem.getTicketTierId(),
                        String.valueOf(tierItem.getQuantity())
                );
            }

            // Use a platform charge for all purchases. Organizer settlement is handled later via payout jobs.
            if (organizerStripeAccountId != null && !organizerStripeAccountId.isBlank()) {
                log.info("Creating platform charge for organizer {} with delayed Stripe payout", organizer.getId());
                paramsBuilder
                    .putMetadata("payout_type", "stripe_transfer_later")
                    .putMetadata("destination_account_id", organizerStripeAccountId);
            } else {
                // Manual payout: platform keeps everything, organizer amount pending manual transfer
                log.info("Setting up manual payout for organizer: {}", organizer.getId());
                paramsBuilder
                    .putMetadata("payout_type", "manual")
                    .putMetadata("organizer_amount_pending", organizerMajor.toPlainString());
            }
            
            PaymentIntentCreateParams params = paramsBuilder.build();
            
            // Create PaymentIntent on platform account (NOT on connected account)
            PaymentIntent paymentIntent = PaymentIntent.create(params);

            log.info("✓ PaymentIntent created: {} | Total: {} {} | Organizer gets: {} {} | Platform fee: {} {}", 
                    paymentIntent.getId(), 
                    totalMajor, currency.toUpperCase(),
                    organizerMajor, currency.toUpperCase(),
                    serviceFeeMajor, currency.toUpperCase());

            // Store payment record
            PaymentRecord paymentRecord = PaymentRecord.builder()
                    .user(user)
                    .event(event)
                    .stripeIntentId(paymentIntent.getId())
                    .amount(totalMajor)
                    .subtotalAmount(subtotalMajor)
                    .serviceFeeAmount(serviceFeeMajor)
                    .organizerAmount(organizerMajor)
                    .currency(currency.toUpperCase())
                    .status(PaymentRecord.PaymentStatus.PENDING)
                    .paymentMethod(PaymentRecord.PaymentMethod.CARD)
                    .paymentDescription("Ticket purchase: " + event.getTitle() + " - " + ticketDescription)
                    .build();

            paymentRecordRepository.save(paymentRecord);

            log.info("Payment intent created: {}", paymentIntent.getId());

            return PaymentIntentResponse.builder()
                    .clientSecret(paymentIntent.getClientSecret())
                    .paymentIntentId(paymentIntent.getId())
                    .status(paymentIntent.getStatus())
                    .createdAt(paymentIntent.getCreated())
                    .build();

        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (StripeException e) {
            log.error("Stripe API error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create payment intent: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error creating payment intent", e);
            throw new RuntimeException("Error creating payment intent: " + e.getMessage(), e);
        }
    }

    private boolean isStripeConfigured() {
        String key = stripeApiKey == null ? "" : stripeApiKey.trim();
        if (key.isEmpty()) {
            return false;
        }
        String lowered = key.toLowerCase(Locale.ROOT);
        if (lowered.startsWith("replace-") || lowered.startsWith("your_") || lowered.contains("placeholder")) {
            return false;
        }
        return key.startsWith("sk_test_") || key.startsWith("sk_live_");
    }

    private String findOrCreateStripeCustomer(User user) throws StripeException {
        if (user == null) {
            throw new IllegalArgumentException("User is required to create payment intent");
        }

        String email = user.getEmail();
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("User email is required for checkout");
        }

        CustomerListParams listParams = CustomerListParams.builder()
                .setEmail(email.trim())
                .setLimit(1L)
                .build();

        var existing = Customer.list(listParams);
        if (existing != null && existing.getData() != null && !existing.getData().isEmpty()) {
            return existing.getData().get(0).getId();
        }

        CustomerCreateParams createParams = CustomerCreateParams.builder()
                .setEmail(email.trim())
                .setName(((user.getFirstName() != null ? user.getFirstName() : "") + " "
                        + (user.getLastName() != null ? user.getLastName() : "")).trim())
                .putMetadata("user_id", String.valueOf(user.getId()))
                .build();

        Customer created = Customer.create(createParams);
        return created.getId();
    }

    /**
     * Confirm payment status by checking with Stripe
     */
    public PaymentRecord confirmPaymentStatus(String stripeIntentId) {
        return confirmPaymentStatusInternal(stripeIntentId, false);
    }

    public PaymentRecord finalizePaymentFromWebhook(String stripeIntentId) {
        return confirmPaymentStatusInternal(stripeIntentId, true);
    }

    private PaymentRecord confirmPaymentStatusInternal(String stripeIntentId, boolean fromWebhook) {
        if (stripeIntentId == null || stripeIntentId.trim().isEmpty()) {
            throw new IllegalArgumentException("Stripe Intent ID cannot be null or empty");
        }

        try {
            log.info("Confirming payment status for intent: {} (fromWebhook={})", stripeIntentId, fromWebhook);

            // Retrieve payment intent from Stripe
            PaymentIntent paymentIntent = PaymentIntent.retrieve(stripeIntentId);

            // Find existing payment record
            PaymentRecord paymentRecord = paymentRecordRepository.findByStripeIntentId(stripeIntentId)
                    .orElseThrow(() -> new IllegalArgumentException("Payment record not found for intent: " + stripeIntentId));

            // Update payment record status based on Stripe status
            if ("succeeded".equals(paymentIntent.getStatus())) {
                paymentRecord.setStatus(PaymentRecord.PaymentStatus.SUCCEEDED);
                // Store the payment intent ID as reference (charge details available via Stripe API)
                paymentRecord.setStripeChargeId(paymentIntent.getId());
            } else if ("failed".equals(paymentIntent.getStatus())) {
                paymentRecord.setStatus(PaymentRecord.PaymentStatus.FAILED);
                paymentRecord.setFailureReason(paymentIntent.getLastPaymentError() != null ? 
                        paymentIntent.getLastPaymentError().getMessage() : "Payment failed");
            } else if ("canceled".equals(paymentIntent.getStatus())) {
                paymentRecord.setStatus(PaymentRecord.PaymentStatus.CANCELLED);
            } else {
                // Default case for other statuses (processing, requires_action, etc.)
                log.warn("Payment status not yet finalized: {}", paymentIntent.getStatus());
                paymentRecord.setStatus(PaymentRecord.PaymentStatus.PENDING);
            }

            paymentRecord = paymentRecordRepository.save(paymentRecord);

            if (paymentRecord.getStatus() == PaymentRecord.PaymentStatus.SUCCEEDED) {
                ticketService.issueTicketsForConfirmedPayment(paymentRecord, paymentIntent.getMetadata());
            }

            log.info("Payment status updated: {} -> {}", stripeIntentId, paymentRecord.getStatus());
            return paymentRecord;

        } catch (IllegalArgumentException e) {
            log.warn("Validation error confirming payment: {}", e.getMessage());
            throw e;
        } catch (StripeException e) {
            log.error("Stripe API error confirming payment: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to confirm payment: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error confirming payment status", e);
            throw new RuntimeException("Error confirming payment: " + e.getMessage(), e);
        }
    }

    /**
     * Get payment record by intent ID
     */
    public PaymentRecord getPaymentRecord(String stripeIntentId) {
        return paymentRecordRepository.findByStripeIntentId(stripeIntentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found"));
    }

    /**
     * Verify and enable card_payments capability on organizer's Stripe account
     */
    private void verifyAndEnableCardPaymentsCapability(String accountId) throws StripeException {
        if (accountId == null || accountId.isBlank()) {
            throw new IllegalArgumentException("Account ID cannot be null or empty");
        }

        try {
            // Retrieve account to check current capabilities
            Account account = Account.retrieve(accountId);
            
            // Check if card_payments capability exists and is active
            if (account.getCapabilities() != null) {
                log.info("Checking capabilities for account: {}", accountId);
                // Try to get the card_payments capability status
                // Capabilities is a nested object, we need to check if it's already requested
            }

            // Request card payments capability (this won't fail if already active)
            log.info("Requesting card_payments capability for account: {}", accountId);
            AccountUpdateParams updateParams = 
                AccountUpdateParams.builder()
                    .setCapabilities(
                        AccountUpdateParams.Capabilities.builder()
                            .setCardPayments(
                                AccountUpdateParams.Capabilities.CardPayments.builder()
                                    .setRequested(true)
                                    .build())
                            .setTransfers(
                                AccountUpdateParams.Capabilities.Transfers.builder()
                                    .setRequested(true)
                                    .build())
                            .build())
                    .build();
            
            account.update(updateParams);
            log.info("✓ Capability request submitted for account: {}", accountId);

        } catch (CardException e) {
            log.error("Card error verifying capabilities: {}", e.getMessage());
            throw new RuntimeException("Card error: " + e.getMessage());
        } catch (AuthenticationException e) {
            log.error("Authentication error: {}", e.getMessage());
            throw new RuntimeException("Authentication error: " + e.getMessage());
        } catch (RateLimitException e) {
            log.error("Rate limit error: {}", e.getMessage());
            throw new RuntimeException("Rate limit error: " + e.getMessage());
        } catch (InvalidRequestException e) {
            log.error("Invalid request error: {}", e.getMessage());
            throw new RuntimeException("Invalid request error: " + e.getMessage());
        } catch (StripeException e) {
            log.error("Stripe error verifying capabilities: {}", e.getMessage());
            throw new RuntimeException("Stripe error: " + e.getMessage());
        }
    }
}
