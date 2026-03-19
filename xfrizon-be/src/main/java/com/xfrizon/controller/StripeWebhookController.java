package com.xfrizon.controller;

import com.stripe.model.Event;
import com.stripe.model.Account;
import com.stripe.net.Webhook;
import com.xfrizon.entity.User;
import com.xfrizon.repository.UserRepository;
import com.xfrizon.service.OrganizerVerificationService;
import com.xfrizon.service.FraudDetectionService;
import com.xfrizon.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Webhook controller for handling Stripe events
 * Processes account verification updates, chargebacks, disputes, etc.
 */
@RestController
@RequestMapping("/api/v1/webhooks")
@Slf4j
@RequiredArgsConstructor
public class StripeWebhookController {

    private final UserRepository userRepository;
    private final OrganizerVerificationService verificationService;
    private final FraudDetectionService fraudDetectionService;
    private final PaymentService paymentService;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    /**
     * Handle Stripe webhook events
     * POST /api/v1/webhooks/stripe
     */
    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signatureHeader) {

        try {
            // Verify webhook signature
            Event event = Webhook.constructEvent(payload, signatureHeader, webhookSecret);

            log.info("Received Stripe webhook event: {}", event.getType());

            // Route event to appropriate handler
            switch (event.getType()) {
                case "payment_intent.succeeded":
                    handlePaymentIntentSucceeded(event);
                    break;
                case "payment_intent.payment_failed":
                    handlePaymentIntentFailed(event);
                    break;
                case "account.updated":
                    handleAccountUpdated(event);
                    break;
                case "account.external_account.created":
                    handleExternalAccountCreated(event);
                    break;
                case "charge.dispute.created":
                    handleDisputeCreated(event);
                    break;
                case "charge.dispute.closed":
                    handleDisputeClosed(event);
                    break;
                default:
                    log.debug("Unhandled webhook event: {}", event.getType());
            }

            return ResponseEntity.ok("Webhook processed");

        } catch (com.stripe.exception.SignatureVerificationException e) {
            log.error("Invalid Stripe webhook signature", e);
            return ResponseEntity.status(400).body("Invalid signature");
        } catch (Exception e) {
            log.error("Error processing Stripe webhook", e);
            return ResponseEntity.status(500).body("Error processing webhook");
        }
    }

    private void handlePaymentIntentSucceeded(Event event) {
        try {
            com.stripe.model.PaymentIntent paymentIntent =
                    (com.stripe.model.PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
            if (paymentIntent == null || paymentIntent.getId() == null || paymentIntent.getId().isBlank()) {
                log.warn("payment_intent.succeeded webhook had no payment intent payload");
                return;
            }

            paymentService.finalizePaymentFromWebhook(paymentIntent.getId());
            log.info("Webhook finalized payment intent {}", paymentIntent.getId());
        } catch (Exception e) {
            log.error("Error handling payment_intent.succeeded webhook", e);
        }
    }

    private void handlePaymentIntentFailed(Event event) {
        try {
            com.stripe.model.PaymentIntent paymentIntent =
                    (com.stripe.model.PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
            if (paymentIntent == null || paymentIntent.getId() == null || paymentIntent.getId().isBlank()) {
                return;
            }

            paymentService.finalizePaymentFromWebhook(paymentIntent.getId());
            log.info("Webhook updated failed payment intent {}", paymentIntent.getId());
        } catch (Exception e) {
            log.error("Error handling payment_intent.payment_failed webhook", e);
        }
    }

    /**
     * Handle account.updated events
     * Fired when account verification status changes
     */
    private void handleAccountUpdated(Event event) {
        try {
            Account account = (Account) event.getDataObjectDeserializer().getObject().orElse(null);
            if (account == null) {
                log.warn("No account data in webhook event");
                return;
            }

            String stripeAccountId = account.getId();
            log.info("Processing account.updated for Stripe account: {}", stripeAccountId);

            // Find organizer by Stripe account ID
            Optional<User> organizer = userRepository.findByStripeAccountId(stripeAccountId);
            if (organizer.isEmpty()) {
                log.warn("No organizer found for Stripe account: {}", stripeAccountId);
                return;
            }

            User org = organizer.get();

            // Check if account is now fully verified
            if (accountIsFullyVerified(account)) {
                log.info("Account {} is now fully verified on Stripe", stripeAccountId);
                
                // Update verification status
                org.setVerificationStatus(User.VerificationStatus.STRIPE_VERIFIED);
                org.setVerifiedAt(LocalDateTime.now());
                userRepository.save(org);

                // Run fraud detection automatically
                FraudDetectionService.FraudAnalysisResult fraudAnalysis = 
                    fraudDetectionService.analyzeFraudRisk(org.getId());
                
                log.info("Fraud analysis for organizer {}: risk={}, flags={}", 
                    org.getId(), fraudAnalysis.getRiskLevel(), fraudAnalysis.getFraudFlags());

                // Auto-approve if low risk
                if (fraudAnalysis.getRiskLevel().equals(User.FraudRiskLevel.LOW)) {
                    log.info("Auto-approving organizer {} - low fraud risk", org.getId());
                    verificationService.autoApproveIfLowRisk(org.getId(), 0L); // 0L = system
                }

            } else if (accountHasRequirements(account)) {
                log.warn("Account {} has unmet requirements", stripeAccountId);
                org.setVerificationStatus(User.VerificationStatus.STRIPE_VERIFIED);
                userRepository.save(org);
            }

        } catch (Exception e) {
            log.error("Error handling account.updated webhook", e);
        }
    }

    /**
     * Handle external account creation (bank account linked)
     */
    private void handleExternalAccountCreated(Event event) {
        try {
            log.info("External account created - webhook received");
            // Can use this to update payout capabilities
            // Implementation depends on your business logic
        } catch (Exception e) {
            log.error("Error handling external account webhook", e);
        }
    }

    /**
     * Handle charge disputes (chargebacks)
     * Flag organizer if they have multiple disputes
     */
    private void handleDisputeCreated(Event event) {
        try {
            log.warn("Dispute created - potential fraud indicator");
            // Could trigger fraud re-analysis if high dispute count
        } catch (Exception e) {
            log.error("Error handling dispute webhook", e);
        }
    }

    /**
     * Handle dispute closure
     */
    private void handleDisputeClosed(Event event) {
        try {
            log.info("Dispute closed");
        } catch (Exception e) {
            log.error("Error handling dispute closed webhook", e);
        }
    }

    /**
     * Check if Stripe account is fully verified
     */
    private boolean accountIsFullyVerified(Account account) {
        // Account is verified when:
        // 1. charges_enabled = true (can accept payments)
        // 2. payouts_enabled = true (can receive payouts)
        // 3. No pending requirements
        
        if (account.getChargesEnabled() == null || !account.getChargesEnabled()) {
            return false;
        }
        
        if (account.getPayoutsEnabled() == null || !account.getPayoutsEnabled()) {
            return false;
        }

        // Check if there are pending requirements
        if (account.getRequirements() != null && 
            account.getRequirements().getPastDue() != null && 
            !account.getRequirements().getPastDue().isEmpty()) {
            return false;
        }

        return true;
    }

    /**
     * Check if account has pending requirements
     */
    private boolean accountHasRequirements(Account account) {
        if (account.getRequirements() == null) {
            return false;
        }

        if (account.getRequirements().getCurrentlyDue() != null && 
            !account.getRequirements().getCurrentlyDue().isEmpty()) {
            return true;
        }

        return account.getRequirements().getPastDue() != null && 
            !account.getRequirements().getPastDue().isEmpty();
    }

    /**
     * Health check for webhook endpoint
     */
    @GetMapping("/stripe/health")
    public ResponseEntity<String> webkookHealth() {
        return ResponseEntity.ok("Stripe webhook endpoint is active");
    }
}
