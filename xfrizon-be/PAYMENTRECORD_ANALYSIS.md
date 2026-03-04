# Complete PaymentRecord Creation Analysis

## Overview

This document details all places where `PaymentRecord` entities are created, how fees are calculated, and status management.

---

## 1. PaymentRecord Entity Class

**Location**: [src/main/java/com/xfrizon/entity/PaymentRecord.java](src/main/java/com/xfrizon/entity/PaymentRecord.java)

```java
package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_records", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_event_id", columnList = "event_id"),
    @Index(name = "idx_stripe_intent_id", columnList = "stripe_intent_id"),
    @Index(name = "idx_payment_status", columnList = "status"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, unique = true)
    private String stripeIntentId;

    @Column(nullable = false)
    private BigDecimal amount;

    // Amount breakdown (major units)
    @Column(name = "subtotal_amount", columnDefinition = "DECIMAL(19,2)")
    private BigDecimal subtotalAmount;

    @Column(name = "service_fee_amount", columnDefinition = "DECIMAL(19,2)")
    private BigDecimal serviceFeeAmount;

    @Column(name = "organizer_amount", columnDefinition = "DECIMAL(19,2)")
    private BigDecimal organizerAmount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    private String stripeChargeId;

    private String paymentDescription;

    private String failureReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum PaymentStatus {
        PENDING,
        SUCCEEDED,
        FAILED,
        CANCELLED,
        REFUNDED
    }

    public enum PaymentMethod {
        CARD,
        BANK_TRANSFER,
        WALLET,
        OTHER
    }
}
```

**Key Fields**:

- `amount`: Total amount (subtotal + service fee) in major units (dollars, not cents)
- `subtotalAmount`: Price of tickets only
- `serviceFeeAmount`: 10% of subtotalAmount
- `organizerAmount`: Amount organizer receives (equal to subtotalAmount)
- `status`: Lifecycle state (PENDING → SUCCEEDED/FAILED/CANCELLED)
- `currency`: ISO 4217 currency code (e.g., "USD", "NGN")

---

## 2. PaymentRecord Creation Location

### ONLY Place Where PaymentRecords Are Created

**Location**: [src/main/java/com/xfrizon/service/PaymentService.java](src/main/java/com/xfrizon/service/PaymentService.java#L145)
**Method**: `createPaymentIntent(Long userId, CreatePaymentIntentRequest request)`

```java
/**
 * Create a Stripe PaymentIntent for ticket purchase (supports multiple ticket tiers)
 */
public PaymentIntentResponse createPaymentIntent(Long userId, CreatePaymentIntentRequest request) {
    try {
        log.info("Creating payment intent for user: {}, event: {}, amount: {}",
                userId, request.getEventId(), request.getAmount());

        // Validate inputs
        if (request.getEventId() == null || request.getEventId() <= 0) {
            throw new IllegalArgumentException("Invalid event ID");
        }
        if (request.getTicketTiers() == null || request.getTicketTiers().isEmpty()) {
            throw new IllegalArgumentException("At least one ticket tier must be selected");
        }

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

        // ========================================================================
        // FEE CALCULATION (THIS IS THE CRITICAL PART)
        // ========================================================================
        subtotalMajor = subtotalMajor.setScale(2, RoundingMode.HALF_UP);
        BigDecimal serviceFeeMajor = subtotalMajor.multiply(serviceFeeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalMajor = subtotalMajor.add(serviceFeeMajor).setScale(2, RoundingMode.HALF_UP);
        BigDecimal organizerMajor = subtotalMajor;

        // Where serviceFeeRate comes from:
        // @Value("${xfrizon.service-fee-rate:0.10}")
        // private BigDecimal serviceFeeRate;
        // Default: 0.10 (10%)

        // Summary:
        // serviceFeeAmount = subtotalAmount * 0.10
        // organizerAmount = subtotalAmount (NOT subtotal - fee, but just the subtotal)
        // totalAmount = subtotalAmount + serviceFeeAmount
        // ========================================================================

        // Validate currency and check minimum amount
        String currency = request.getCurrency() != null ? request.getCurrency().toLowerCase() : "ngn";
        Long amountInSmallestUnit = totalMajor.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
        Long applicationFeeInSmallestUnit = serviceFeeMajor.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
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
        PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                .setAmount(amountInSmallestUnit) // Already in cents from frontend
                .setCurrency(currency)
                .setDescription("Ticket purchase for: " + event.getTitle() + " - " + ticketDescription)
                .putMetadata("user_id", userId.toString())
                .putMetadata("event_id", request.getEventId().toString())
                .putMetadata("event_title", event.getTitle())
                .putMetadata("subtotal_major", subtotalMajor.toPlainString())
                .putMetadata("service_fee_major", serviceFeeMajor.toPlainString())
                .putMetadata("total_major", totalMajor.toPlainString())
                .putMetadata("organizer_id", organizer.getId().toString());

        // If organizer has Stripe Connect account, use destination charge pattern
        if (organizerStripeAccountId != null && !organizerStripeAccountId.isBlank()) {
            log.info("Setting up destination charge for organizer account: {}", organizerStripeAccountId);

            paramsBuilder
                // Transfer funds to connected account after platform receives payment
                .setTransferData(
                    PaymentIntentCreateParams.TransferData.builder()
                        .setDestination(organizerStripeAccountId)
                        .build()
                )
                // Attribute the payment to the connected account for their dashboard
                .setOnBehalfOf(organizerStripeAccountId)
                // Platform's application fee (valid with transfer_data)
                .setApplicationFeeAmount(applicationFeeInSmallestUnit)
                .putMetadata("payout_type", "stripe_connect");
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

        // ========================================================================
        // PAYMENTRECORD CREATION (THIS IS WHERE THE ENTITY IS SAVED)
        // ========================================================================
        PaymentRecord paymentRecord = PaymentRecord.builder()
                .user(user)
                .event(event)
                .stripeIntentId(paymentIntent.getId())
                .amount(totalMajor)                           // Total: subtotal + fee
                .subtotalAmount(subtotalMajor)                // Ticket price only
                .serviceFeeAmount(serviceFeeMajor)            // 10% of subtotal
                .organizerAmount(organizerMajor)              // Given to organizer (= subtotal)
                .currency(currency.toUpperCase())
                .status(PaymentRecord.PaymentStatus.PENDING)  // Starts as PENDING
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

    } catch (StripeException e) {
        log.error("Stripe API error: {}", e.getMessage(), e);
        throw new RuntimeException("Failed to create payment intent: " + e.getMessage(), e);
    } catch (Exception e) {
        log.error("Error creating payment intent", e);
        throw new RuntimeException("Error creating payment intent: " + e.getMessage(), e);
    }
}
```

---

## 3. Fee Calculation Detail

### Configuration

**Default Service Fee Rate**: 10% (0.10)
**Location**: Application configuration property `xfrizon.service-fee-rate`
**Default Value**: `0.10`

```properties
# application.properties or environment variable
xfrizon.service-fee-rate=0.10
```

### Calculation Logic

```
subtotalAmount = Sum of (ticket_tier.price * quantity) for all selected tiers
serviceFeeAmount = subtotalAmount × 0.10 (rounded to 2 decimal places)
organizerAmount = subtotalAmount (NOT reduced by fee)
amount (total) = subtotalAmount + serviceFeeAmount
```

**Example**:

```
User purchases:
- 2x Tier 1 tickets @ $50 = $100
- 1x Tier 2 tickets @ $30 = $30
Subtotal = $130

Service Fee = $130 × 0.10 = $13.00
Organizer Amount = $130
Total Charged = $130 + $13 = $143

Platform receives:     $13 (fee)
Organizer receives:    $130
```

---

## 4. Status Lifecycle

### Status Created as PENDING

When `PaymentRecord` is created in `createPaymentIntent()`:

```java
.status(PaymentRecord.PaymentStatus.PENDING)  // Initial status
```

### Status Updated to SUCCEEDED

**Location**: [src/main/java/com/xfrizon/service/PaymentService.java](src/main/java/com/xfrizon/service/PaymentService.java#L254)
**Method**: `confirmPaymentStatus(String stripeIntentId)`

```java
/**
 * Confirm payment status by checking with Stripe
 */
public PaymentRecord confirmPaymentStatus(String stripeIntentId) {
    if (stripeIntentId == null || stripeIntentId.trim().isEmpty()) {
        throw new IllegalArgumentException("Stripe Intent ID cannot be null or empty");
    }

    try {
        log.info("Confirming payment status for intent: {}", stripeIntentId);

        // Retrieve payment intent from Stripe
        PaymentIntent paymentIntent = PaymentIntent.retrieve(stripeIntentId);

        // Find existing payment record
        PaymentRecord paymentRecord = paymentRecordRepository.findByStripeIntentId(stripeIntentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found for intent: " + stripeIntentId));

        // Update payment record status based on Stripe status
        if ("succeeded".equals(paymentIntent.getStatus())) {
            paymentRecord.setStatus(PaymentRecord.PaymentStatus.SUCCEEDED);  // ← STATUS SET TO SUCCEEDED
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

        paymentRecordRepository.save(paymentRecord);

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
```

### Status Transitions

```
PENDING
  ↓ confirmPaymentStatus() checks Stripe
  ├─→ SUCCEEDED (if stripe status == "succeeded")
  ├─→ FAILED (if stripe status == "failed")
  ├─→ CANCELLED (if stripe status == "canceled")
  └─→ PENDING (for processing/requires_action/other statuses)
```

---

## 5. PaymentRecord Validation & Usage

### Located in TicketService

**Location**: [src/main/java/com/xfrizon/service/TicketService.java](src/main/java/com/xfrizon/service/TicketService.java#L52)
**Method**: `recordTicketPurchase(Long userId, TicketPurchaseRequest request)`

```java
/**
 * Record a ticket purchase after successful payment
 */
public UserTicketResponse recordTicketPurchase(Long userId, TicketPurchaseRequest request) {
    try {
        log.info("Recording ticket purchase for user: {}, event: {}, quantity: {}",
                userId, request.getEventId(), request.getQuantity());

        // ✅ CRITICAL VALIDATION: Check PaymentRecord exists and SUCCEEDED
        PaymentRecord paymentRecord = paymentRecordRepository.findByStripeIntentId(request.getPaymentIntentId())
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found"));

        if (!paymentRecord.getStatus().equals(PaymentRecord.PaymentStatus.SUCCEEDED)) {
            throw new IllegalArgumentException("Payment not successful");
        }

        // ... rest of ticket creation logic ...
    } catch (Exception e) {
        log.error("Error recording ticket purchase", e);
        throw new RuntimeException("Error recording ticket purchase: " + e.getMessage(), e);
    }
}
```

**Key Points**:

- Only tickets can be created if PaymentRecord exists
- Status MUST be SUCCEEDED
- This is the SAFE path for ticket creation

### ⚠️ Unsafe Method (No PaymentRecord Validation)

**Location**: [src/main/java/com/xfrizon/service/UserTicketService.java](src/main/java/com/xfrizon/service/UserTicketService.java#L33)
**Method**: `purchaseTicket(Long userId, TicketPurchaseRequest request)`

```java
@Transactional
public UserTicketResponse purchaseTicket(Long userId, com.xfrizon.dto.TicketPurchaseRequest request) {
    // ❌ NO PAYMENT RECORD VALIDATION!
    // ❌ Ticket can be created without checking if payment succeeded!

    // Validate user exists
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    // Validate event exists
    Event event = eventRepository.findById(request.getEventId())
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    // Validate ticket tier exists
    TicketTier ticketTier = ticketTierRepository.findById(request.getTicketId())
            .orElseThrow(() -> new IllegalArgumentException("Ticket tier not found"));

    // ... more validation but NO PaymentRecord check ...

    UserTicket ticket = UserTicket.builder()
            .user(user)
            .event(event)
            .ticketTier(ticketTier)
            .quantity(request.getQuantity())
            .purchasePrice(request.getTotalPrice())
            .paymentIntentId(request.getPaymentIntentId())
            .status(UserTicket.TicketStatus.ACTIVE)
            .build();
    ticket = userTicketRepository.save(ticket);
    return UserTicketResponse.fromEntity(ticket);
}
```

**WARNING**: This method allows creating tickets without verifying payment. It should validate PaymentRecord status.

---

## 6. API Endpoints

### Create Payment Intent

**Endpoint**: `POST /api/v1/payments/create-intent`
**Controller**: [PaymentController.java](src/main/java/com/xfrizon/controller/PaymentController.java)
**Authentication**: Required

```java
@PostMapping("/create-intent")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ApiResponse<PaymentIntentResponse>> createPaymentIntent(
        @Valid @RequestBody CreatePaymentIntentRequest request,
        HttpServletRequest httpRequest) {
    // Calls PaymentService.createPaymentIntent()
}
```

### Confirm Payment Status

**Endpoint**: `POST /api/v1/payments/{intentId}/confirm`
**Controller**: [PaymentController.java](src/main/java/com/xfrizon/controller/PaymentController.java)
**Authentication**: Required

```java
@PostMapping("/{intentId}/confirm")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ApiResponse<Object>> confirmPayment(
        @PathVariable String intentId) {
    // Calls PaymentService.confirmPaymentStatus()
}
```

### Get Payment Record

**Endpoint**: `GET /api/v1/payments/{intentId}`
**Controller**: [PaymentController.java](src/main/java/com/xfrizon/controller/PaymentController.java)
**Authentication**: Required

```java
@GetMapping("/{intentId}")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ApiResponse<Object>> getPayment(
        @PathVariable String intentId) {
    // Calls PaymentService.getPaymentRecord()
}
```

---

## 7. Database Schema

**Table**: `payment_records`

```sql
CREATE TABLE IF NOT EXISTS payment_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    stripe_intent_id VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(19, 2) NOT NULL,
    subtotal_amount DECIMAL(19, 2),
    service_fee_amount DECIMAL(19, 2),
    organizer_amount DECIMAL(19, 2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'CARD',
    stripe_charge_id VARCHAR(255),
    payment_description TEXT,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT FK_payment_records_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT FK_payment_records_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,

    INDEX idx_user_id (user_id),
    INDEX idx_event_id (event_id),
    INDEX idx_stripe_intent_id (stripe_intent_id),
    INDEX idx_payment_status (status),
    INDEX idx_created_at (created_at)
);
```

---

## 8. Repository Methods

**Location**: [src/main/java/com/xfrizon/repository/PaymentRecordRepository.java](src/main/java/com/xfrizon/repository/PaymentRecordRepository.java)

### Key Query Methods

```java
// Find by Stripe Intent ID (used in confirmPaymentStatus and recordTicketPurchase)
Optional<PaymentRecord> findByStripeIntentId(String stripeIntentId);

// Find all payments for a user
Page<PaymentRecord> findByUserId(Long userId, Pageable pageable);
List<PaymentRecord> findByUserIdOrderByCreatedAtDesc(Long userId);

// Find payments by event
Page<PaymentRecord> findByEventId(Long eventId, Pageable pageable);

// Find by status
Page<PaymentRecord> findByStatus(PaymentRecord.PaymentStatus status, Pageable pageable);

// Revenue calculations
BigDecimal getTotalRevenueByEvent(Long eventId);
BigDecimal getTotalPaidByUser(Long userId);

// Count successful payments
Long countSuccessfulPaymentsByEvent(Long eventId);
Long countUniquePayersByEvent(Long eventId);

// Find within date range
List<PaymentRecord> findPaymentsBetweenDates(LocalDateTime startDate, LocalDateTime endDate);
List<PaymentRecord> findUserEventPayments(Long userId, Long eventId);
List<PaymentRecord> findPaymentsByOrganizerWithinDateRange(Long organizerId, LocalDateTime startDate, LocalDateTime endDate);
```

---

## 9. Stripe Integration Points

### Payment Intent Creation

**Stripe API Call**: `PaymentIntent.create(params)`

- Sets amount in smallest currency unit (cents)
- Tracks metadata for organizer and ticket information
- Uses `TransferData` for Stripe Connect accounts
- Uses `ApplicationFeeAmount` for platform fee

### Payment Status Confirmation

**Stripe API Call**: `PaymentIntent.retrieve(stripeIntentId)`

- Retrieves current payment intent status from Stripe
- Maps Stripe status to local `PaymentRecord.PaymentStatus`
- Updates local database record

### Webhook Handling

**Location**: [src/main/java/com/xfrizon/controller/StripeWebhookController.java](src/main/java/com/xfrizon/controller/StripeWebhookController.java)

_Note: This webhook controller handles account verification webhooks, NOT payment confirmation webhooks. Payment confirmation is done via the `confirmPaymentStatus()` endpoint._

---

## 10. Test/Demo Data

**Status**: ❌ No dedicated test PaymentRecords in the codebase

The system is designed for real Stripe integrations. There are no:

- SQL INSERT statements for PaymentRecord test data
- DataInitializer beans creating PaymentRecords
- Test fixtures or mock data

All PaymentRecords must be created through:

1. `PaymentService.createPaymentIntent()` → Creates PENDING record
2. `PaymentService.confirmPaymentStatus()` → Updates to SUCCEEDED (or other status)

---

## 11. Summary Table

| Aspect                      | Detail                                                                          |
| --------------------------- | ------------------------------------------------------------------------------- |
| **Creation Location**       | `PaymentService.createPaymentIntent()`                                          |
| **Initial Status**          | PENDING                                                                         |
| **Status Updated To**       | SUCCEEDED (via `confirmPaymentStatus()`)                                        |
| **Service Fee Calculation** | `subtotalAmount × 0.10`                                                         |
| **Organizer Amount**        | `subtotalAmount` (NOT reduced by fee)                                           |
| **Total Amount**            | `subtotalAmount + serviceFeeAmount`                                             |
| **Database Columns**        | `amount`, `subtotal_amount`, `service_fee_amount`, `organizer_amount`, `status` |
| **Validation Before Use**   | In `TicketService.recordTicketPurchase()`                                       |
| **Default Fee Rate**        | 0.10 (10%) from `xfrizon.service-fee-rate` property                             |
| **No Test Data**            | ❌ All records created via Stripe API                                           |
| **Stripe Connection**       | Supports Stripe Connect (destination charges) and manual payouts                |

---

## Files Referenced

1. [Entity Definition](src/main/java/com/xfrizon/entity/PaymentRecord.java)
2. [Payment Service Creation](src/main/java/com/xfrizon/service/PaymentService.java)
3. [Payment Service Fee Logic Lines 145-260](src/main/java/com/xfrizon/service/PaymentService.java#L145)
4. [Status Confirmation Lines 254-310](src/main/java/com/xfrizon/service/PaymentService.java#L254)
5. [Ticket Service Validation](src/main/java/com/xfrizon/service/TicketService.java#L52)
6. [Payment Controller](src/main/java/com/xfrizon/controller/PaymentController.java)
7. [Repository Interface](src/main/java/com/xfrizon/repository/PaymentRecordRepository.java)
8. [Webhook Controller](src/main/java/com/xfrizon/controller/StripeWebhookController.java)
