# UserTicket Creation Flow Analysis

## Executive Summary

There is a **CRITICAL GAP** in the UserTicket creation flow. The application has TWO different methods that create UserTickets:

1. **TicketService.recordTicketPurchase()** - SAFE ✅ (validates PaymentRecord)
2. **UserTicketService.purchaseTicket()** - UNSAFE ⚠️ (NO PaymentRecord validation)

## Complete Code Files

### 1. POST Endpoint: UserTicketController.java

**Location**: `src/main/java/com/xfrizon/controller/UserTicketController.java`

```java
@PostMapping
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ApiResponse<UserTicketResponse>> purchaseTicket(
        @RequestBody com.xfrizon.dto.TicketPurchaseRequest request,
        HttpServletRequest httpRequest) {
    try {
        Long userId = extractUserIdFromToken(httpRequest);
        UserTicketResponse ticket = ticketService.recordTicketPurchase(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ticket, "Ticket purchased successfully"));
    } catch (IllegalArgumentException e) {
        log.warn("Invalid ticket purchase request: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage(), 400));
    } catch (Exception e) {
        log.error("Error purchasing ticket", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to purchase ticket: " + e.getMessage(), 500));
    }
}

// Endpoint: POST /api/v1/user-tickets
```

---

### 2. SAFE Service Method: TicketService.recordTicketPurchase()

**Location**: `src/main/java/com/xfrizon/service/TicketService.java`

```java
/**
 * Record a ticket purchase after successful payment
 */
public UserTicketResponse recordTicketPurchase(Long userId, TicketPurchaseRequest request) {
    try {
        log.info("Recording ticket purchase for user: {}, event: {}, quantity: {}",
                userId, request.getEventId(), request.getQuantity());

        // ✅ VALIDATION: Check PaymentRecord exists and SUCCEEDED
        PaymentRecord paymentRecord = paymentRecordRepository.findByStripeIntentId(request.getPaymentIntentId())
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found"));

        if (!paymentRecord.getStatus().equals(PaymentRecord.PaymentStatus.SUCCEEDED)) {
            throw new IllegalArgumentException("Payment not successful");
        }

        // Validate user and event
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        TicketTier ticketTier = ticketTierRepository.findById(request.getTicketId())
                .orElseThrow(() -> new IllegalArgumentException("Ticket tier not found"));

        // Validate ticket tier belongs to event
        if (!ticketTier.getEvent().getId().equals(event.getId())) {
            throw new IllegalArgumentException("Ticket tier does not belong to this event");
        }

        // Compute authoritative amounts (major units)
        BigDecimal unitPrice = ticketTier.getPrice() != null ? ticketTier.getPrice() : BigDecimal.ZERO;
        BigDecimal quantity = BigDecimal.valueOf(request.getQuantity() != null ? request.getQuantity() : 0);
        BigDecimal subtotal = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        BigDecimal serviceFee = subtotal.multiply(serviceFeeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(serviceFee).setScale(2, RoundingMode.HALF_UP);

        // Update ticket tier sold quantity
        Integer currentSold = ticketTier.getQuantitySold();
        ticketTier.setQuantitySold(currentSold + request.getQuantity());
        ticketTierRepository.save(ticketTier);

        // Generate validation code and QR code
        String validationCode = UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        String qrCodeData = generateQRCodeData(user.getId(), event.getId(), ticketTier.getId(), validationCode);

        // ✅ Create user ticket record (ONLY after payment confirmed)
        UserTicket userTicket = UserTicket.builder()
                .user(user)
                .event(event)
                .ticketTier(ticketTier)
                .quantity(request.getQuantity())
                .purchasePrice(subtotal)
                .subtotalPrice(subtotal)
                .serviceFee(serviceFee)
                .totalPrice(total)
                .validationCode(validationCode)
                .qrCodeData(qrCodeData)
                .paymentIntentId(request.getPaymentIntentId())
                .status(UserTicket.TicketStatus.ACTIVE)
                .build();

        userTicket = userTicketRepository.save(userTicket);

        log.info("Ticket purchase recorded: ticket_id: {}, quantity: {}", userTicket.getId(), request.getQuantity());

        // Convert to response
        UserTicketResponse response = convertToResponse(userTicket);

        // Send confirmation email
        try {
            emailService.sendTicketConfirmationEmail(response, user);
        } catch (Exception e) {
            log.warn("Failed to send confirmation email for ticket {}: {}", userTicket.getId(), e.getMessage());
            // Don't fail the purchase if email fails
        }

        return response;

    } catch (Exception e) {
        log.error("Error recording ticket purchase", e);
        throw new RuntimeException("Error recording ticket purchase: " + e.getMessage(), e);
    }
}
```

---

### 3. UNSAFE Service Method: UserTicketService.purchaseTicket()

**Location**: `src/main/java/com/xfrizon/service/UserTicketService.java`

⚠️ **THIS METHOD IS DANGEROUS** - It does NOT validate PaymentRecord!

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

---

### 4. PaymentRecord Creation: PaymentService.createPaymentIntent()

**Location**: `src/main/java/com/xfrizon/service/PaymentService.java`

```java
/**
 * Create a Stripe PaymentIntent for ticket purchase (supports multiple ticket tiers)
 */
public PaymentIntentResponse createPaymentIntent(Long userId, CreatePaymentIntentRequest request) {
    try {
        log.info("Creating payment intent for user: {}, event: {}, amount: {}",
                userId, request.getEventId(), request.getAmount());

        // ... validation code ...

        // Create Stripe PaymentIntent
        PaymentIntentCreateParams params = buildPaymentIntentParams(...);
        PaymentIntent paymentIntent = PaymentIntent.create(params);

        log.info("✓ PaymentIntent created: {} | Total: {} {} | Organizer gets: {} {} | Platform fee: {} {}",
                paymentIntent.getId(),
                totalMajor, currency.toUpperCase(),
                organizerMajor, currency.toUpperCase(),
                serviceFeeMajor, currency.toUpperCase());

        // ✅ Store payment record WITH PENDING STATUS
        PaymentRecord paymentRecord = PaymentRecord.builder()
                .user(user)
                .event(event)
                .stripeIntentId(paymentIntent.getId())
                .amount(totalMajor)
                .subtotalAmount(subtotalMajor)
                .serviceFeeAmount(serviceFeeMajor)
                .organizerAmount(organizerMajor)
                .currency(currency.toUpperCase())
                .status(PaymentRecord.PaymentStatus.PENDING)  // ← Starts as PENDING
                .paymentMethod(PaymentRecord.PaymentMethod.CARD)
                .paymentDescription("Ticket purchase: " + event.getTitle() + " - " + ticketDescription)
                .build();

        paymentRecordRepository.save(paymentRecord);

        return PaymentIntentResponse.builder()
                .clientSecret(paymentIntent.getClientSecret())
                .paymentIntentId(paymentIntent.getId())
                .status(paymentIntent.getStatus())
                .createdAt(paymentIntent.getCreated())
                .build();

    } catch (Exception e) {
        log.error("Error creating payment intent", e);
        throw new RuntimeException("Error creating payment intent: " + e.getMessage(), e);
    }
}
```

---

### 5. PaymentRecord Confirmation: PaymentService.confirmPaymentStatus()

**Location**: `src/main/java/com/xfrizon/service/PaymentService.java`

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

        // ✅ Update payment record status based on Stripe status
        if ("succeeded".equals(paymentIntent.getStatus())) {
            paymentRecord.setStatus(PaymentRecord.PaymentStatus.SUCCEEDED);  // ← Status is updated
            paymentRecord.setStripeChargeId(paymentIntent.getId());
        } else if ("failed".equals(paymentIntent.getStatus())) {
            paymentRecord.setStatus(PaymentRecord.PaymentStatus.FAILED);
            paymentRecord.setFailureReason(paymentIntent.getLastPaymentError() != null ?
                    paymentIntent.getLastPaymentError().getMessage() : "Payment failed");
        } else if ("canceled".equals(paymentIntent.getStatus())) {
            paymentRecord.setStatus(PaymentRecord.PaymentStatus.CANCELLED);
        } else {
            log.warn("Payment status not yet finalized: {}", paymentIntent.getStatus());
            paymentRecord.setStatus(PaymentRecord.PaymentStatus.PENDING);
        }

        paymentRecordRepository.save(paymentRecord);

        log.info("Payment status updated: {} -> {}", stripeIntentId, paymentRecord.getStatus());
        return paymentRecord;

    } catch (Exception e) {
        log.error("Error confirming payment status", e);
        throw new RuntimeException("Error confirming payment: " + e.getMessage(), e);
    }
}
```

---

## Current Flow

```
1. User clicks "Purchase Ticket"
   ↓
2. POST /api/v1/payments/create-intent
   ├─ Creates Stripe PaymentIntent
   └─ Creates PaymentRecord (status=PENDING)
   ↓
3. User enters card details and submits
   ↓
4. POST /api/v1/payments/{intentId}/confirm
   └─ Updates PaymentRecord (status=SUCCEEDED)
   ↓
5. POST /api/v1/user-tickets
   ├─ Calls TicketService.recordTicketPurchase()
   ├─ ✅ VALIDATES PaymentRecord.status == SUCCEEDED
   └─ Creates UserTicket (SAFE)
```

---

## Critical Issues Found

### ⚠️ Issue #1: Unused Unsafe Method

- **File**: `UserTicketService.java`
- **Method**: `purchaseTicket()`
- **Problem**: Does NOT validate PaymentRecord exists or has SUCCEEDED status
- **Risk**: If called directly (via API or test), UserTicket can be created without valid payment
- **Status**: Currently NOT used by the controller, but exists in codebase

### ⚠️ Issue #2: No Foreign Key Relationship

- **File**: `UserTicket.java`
- **Field**: `paymentIntentId` (String type)
- **Problem**: Only a String reference, not a foreign key to PaymentRecord
- **Risk**: Database doesn't enforce referential integrity
- **Consequence**: A UserTicket could orphan or reference a non-existent PaymentRecord

### ⚠️ Issue #3: Missing Link Table

- **Database**: No explicit relationship table between UserTicket and PaymentRecord
- **Impact**: Can't easily query all tickets for a payment, or verify payment details from ticket

---

## Data Model Gap

### UserTicket Entity

```
- id (PK)
- user_id (FK)
- event_id (FK)
- ticket_tier_id (FK)
- quantity
- purchasePrice
- paymentIntentId    ← STRING REFERENCE, not FK!
- status
- validationCode
- Created at
```

### PaymentRecord Entity

```
- id (PK)
- user_id (FK)
- event_id (FK)
- stripeIntentId (UNIQUE)
- amount
- currency
- status (PENDING → SUCCEEDED → PAID)
- Created at
```

**Missing**: Foreign key from UserTicket to PaymentRecord

---

## Recommendations

1. **Delete UserTicketService.purchaseTicket()** - It's dangerous and unused
2. **Add Foreign Key**: `UserTicket.paymentRecordId` → `PaymentRecord.id`
3. **Add Unique Constraint**: Ensure one PaymentRecord per payment session
4. **Add Validation**: Prevent UserTicket creation if PaymentRecord doesn't exist or isn't SUCCEEDED
