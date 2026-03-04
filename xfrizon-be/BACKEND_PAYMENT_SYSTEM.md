# Backend Payment & Ticket System - Implementation Guide

## Overview

This document details the implementation of the payment and ticket purchase system for the Xfrizon ticketing platform.

## Architecture

### New Entities

1. **UserTicket** - Represents a purchased ticket
   - Links User, Event, and TicketTier
   - Tracks purchase date, quantity, price
   - Stores QR code data and validation code
   - Status: ACTIVE, USED, CANCELLED, EXPIRED

2. **PaymentRecord** - Tracks payment transactions
   - Links User and Event
   - Stores Stripe PaymentIntent ID
   - Tracks payment status (PENDING, SUCCEEDED, FAILED, CANCELLED, REFUNDED)
   - Stores charge details and failure reasons

### New Services

1. **PaymentService** - Handles Stripe integration
   - `createPaymentIntent()` - Creates Stripe PaymentIntent
   - `confirmPaymentStatus()` - Updates payment record from Stripe
   - `getPaymentRecord()` - Retrieves payment details

2. **TicketService** - Manages ticket operations
   - `recordTicketPurchase()` - Records purchase after payment
   - `getUserTickets()` - Retrieves user's tickets (paginated)
   - `getUserTicketsList()` - Retrieves user's tickets (list)
   - `getTicket()` - Gets specific ticket details
   - `getEventTickets()` - Gets all tickets for an event
   - `cancelTicket()` - Cancels a ticket
   - `markTicketAsUsed()` - Marks ticket as used at entry

### New Controllers

1. **PaymentController** (/payments)
   - POST `/payments/create-intent` - Create PaymentIntent
   - POST `/payments/confirm/:intentId` - Confirm payment status
   - GET `/payments/:intentId` - Get payment details

2. **TicketController** (/user-tickets)
   - POST `/user-tickets` - Record ticket purchase
   - GET `/user-tickets` - Get user's tickets (paginated)
   - GET `/user-tickets/list` - Get user's tickets (list)
   - GET `/user-tickets/:ticketId` - Get ticket details
   - GET `/user-tickets/:ticketId/download` - Download ticket PDF
   - DELETE `/user-tickets/:ticketId` - Cancel ticket

### New Repositories

1. **UserTicketRepository** - Data access for user tickets
   - Named queries for common operations
   - Pagination support
   - Statistics queries

2. **PaymentRecordRepository** - Data access for payments
   - Named queries for payment lookup
   - Revenue calculations
   - Payment statistics

## Database Schema

### payment_records Table

```sql
- id (Primary Key)
- user_id (Foreign Key → users)
- event_id (Foreign Key → events)
- stripe_intent_id (Unique, Indexed)
- amount (Decimal)
- currency (VARCHAR(3))
- status (Enum: PENDING, SUCCEEDED, FAILED, CANCELLED, REFUNDED)
- payment_method (Enum)
- stripe_charge_id
- payment_description
- failure_reason
- created_at
- updated_at
```

### user_tickets Table

```sql
- id (Primary Key)
- user_id (Foreign Key → users)
- event_id (Foreign Key → events)
- ticket_tier_id (Foreign Key → ticket_tiers)
- quantity (INT)
- purchase_price (Decimal)
- purchase_date (Timestamp)
- qr_code_data (LongText - JSON)
- qr_code_url
- status (Enum: ACTIVE, USED, CANCELLED, EXPIRED)
- validation_code (Unique identifier)
- pdf_url
- created_at
- updated_at
```

## DTOs (Data Transfer Objects)

### CreatePaymentIntentRequest

```json
{
  "event_id": 1,
  "ticket_id": 5,
  "quantity": 2,
  "total": 100.0
}
```

### PaymentIntentResponse

```json
{
  "client_secret": "pi_xxxxx_secret_xxxxx",
  "payment_intent_id": "pi_xxxxx",
  "status": "requires_payment_method",
  "created_at": 1234567890
}
```

### TicketPurchaseRequest

```json
{
  "event_id": 1,
  "ticket_id": 5,
  "quantity": 2,
  "payment_intent_id": "pi_xxxxx",
  "total_price": 100.0
}
```

### UserTicketResponse

```json
{
  "id": 1,
  "event_id": 1,
  "event_title": "Summer Music Festival",
  "event_date": "2024-07-15T18:00:00",
  "event_location": "Central Park, New York",
  "event_flyer_url": "https://...",
  "ticket_id": 5,
  "ticket_tier": "VIP",
  "quantity": 2,
  "purchase_date": "2024-06-01T10:30:00",
  "purchase_price": 100.0,
  "status": "ACTIVE",
  "qr_code_url": "https://...",
  "pdf_url": "https://...",
  "validation_code": "ABC123DEF456"
}
```

## Configuration

### application.properties

Add the following Stripe configuration:

```properties
# Stripe Configuration
stripe.api.key=sk_test_51234567890
```

Replace `sk_test_51234567890` with your actual Stripe secret key from:
https://dashboard.stripe.com/apikeys

### Environment Variables

For production, use environment variables:

```bash
export STRIPE_API_KEY=sk_live_xxxxx
```

Update `application.properties` to read from environment:

```properties
stripe.api.key=${STRIPE_API_KEY:sk_test_51234567890}
```

## Security

### Authentication

All endpoints require valid JWT token in Authorization header:

```
Authorization: Bearer {jwt_token}
```

### Authorization

- Payment and ticket endpoints use `@PreAuthorize("isAuthenticated()")`
- Users can only view their own tickets
- Payment records are user-specific

### Data Protection

- Passwords are hashed (handled by existing AuthService)
- JWT tokens are used for stateless authentication
- Stripe keys never exposed in responses
- PII data encrypted in database (recommended)

## Payment Flow

1. **User clicks "Buy Tickets"**
   - Frontend: POST `/payments/create-intent`
   - Backend: Creates Stripe PaymentIntent
   - Response: Returns `clientSecret`

2. **User enters payment details**
   - Frontend: Uses Stripe PaymentElement
   - Stripe: Validates card with bank

3. **User submits payment form**
   - Frontend: Calls `stripe.confirmPayment()`
   - Stripe: Authenticates payment
   - Response: Success or error

4. **If successful**
   - Frontend: POST `/user-tickets` with `paymentIntentId`
   - Backend: Records ticket purchase
   - Updates ticket tier sold quantity
   - Generates validation code and QR data
   - Response: Created ticket with details

5. **User views ticket**
   - Frontend: GET `/user-tickets/:ticketId`
   - Backend: Returns ticket details with QR code
   - Frontend: Displays QR code and ticket info

## Testing

### Test Case 1: Create Payment Intent

```bash
curl -X POST http://localhost:8081/api/v1/payments/create-intent \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": 1,
    "ticket_id": 5,
    "quantity": 2,
    "total": 100.00
  }'
```

Expected Response:

```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "client_secret": "pi_xxxxx_secret_xxxxx",
    "payment_intent_id": "pi_xxxxx",
    "status": "requires_payment_method",
    "created_at": 1234567890
  }
}
```

### Test Case 2: Record Ticket Purchase

```bash
curl -X POST http://localhost:8081/api/v1/user-tickets \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": 1,
    "ticket_id": 5,
    "quantity": 2,
    "payment_intent_id": "pi_xxxxx",
    "total_price": 100.00
  }'
```

### Test Case 3: Get User Tickets

```bash
curl -X GET "http://localhost:8081/api/v1/user-tickets?page=0&size=10" \
  -H "Authorization: Bearer {token}"
```

## Error Handling

### Common Errors

1. **Invalid Payment Intent Status**
   - Error: "Payment not successful"
   - Cause: Payment not confirmed with Stripe
   - Solution: Verify payment succeeded before recording ticket

2. **Insufficient Tickets Available**
   - Error: "Not enough tickets available"
   - Cause: Quantity exceeds available tickets
   - Solution: Check available quantity before payment

3. **Missing Authorization**
   - Error: "Invalid or missing token"
   - Cause: Missing Authorization header or invalid token
   - Solution: Include valid JWT token in header

4. **User Not Found**
   - Error: "User not found"
   - Cause: Invalid user ID from token
   - Solution: Verify token is valid and user exists

## Future Enhancements

1. **PDF Generation**
   - Generate PDF tickets with QR code
   - Email PDF to user after purchase
   - Implement download endpoint

2. **QR Code Validation**
   - Implement QR code scanning at entry
   - Track ticket usage
   - Prevent duplicate entry

3. **Refunds**
   - Implement refund workflow
   - Track refund status with Stripe
   - Update ticket status to REFUNDED

4. **Email Notifications**
   - Send confirmation email after purchase
   - Include ticket details and QR code
   - Send reminder before event

5. **Analytics**
   - Track ticket sales by tier
   - Revenue reports by event
   - User purchase history

6. **Webhooks**
   - Implement Stripe webhooks for payment updates
   - Handle failed payments
   - Track payment status in real-time

## Deployment Checklist

- [ ] Add Stripe secret key to production environment
- [ ] Run database migrations (002_create_payment_and_ticket_tables.sql)
- [ ] Test payment flow with Stripe test keys
- [ ] Implement PDF generation for tickets
- [ ] Set up email notifications
- [ ] Configure Stripe webhooks
- [ ] Enable production Stripe keys
- [ ] Set up payment monitoring and alerts
- [ ] Create backup strategy for payment data
- [ ] Document operational procedures

## Files Created/Modified

### New Files

- `/src/main/java/com/xfrizon/entity/UserTicket.java`
- `/src/main/java/com/xfrizon/entity/PaymentRecord.java`
- `/src/main/java/com/xfrizon/repository/UserTicketRepository.java`
- `/src/main/java/com/xfrizon/repository/PaymentRecordRepository.java`
- `/src/main/java/com/xfrizon/dto/CreatePaymentIntentRequest.java`
- `/src/main/java/com/xfrizon/dto/PaymentIntentResponse.java`
- `/src/main/java/com/xfrizon/dto/TicketPurchaseRequest.java`
- `/src/main/java/com/xfrizon/dto/UserTicketResponse.java`
- `/src/main/java/com/xfrizon/dto/ApiResponse.java`
- `/src/main/java/com/xfrizon/service/PaymentService.java`
- `/src/main/java/com/xfrizon/service/TicketService.java`
- `/src/main/java/com/xfrizon/controller/PaymentController.java`
- `/src/main/java/com/xfrizon/controller/TicketController.java`
- `/src/main/java/com/xfrizon/config/StripeConfig.java`
- `/src/main/resources/sql/002_create_payment_and_ticket_tables.sql`

### Modified Files

- `/src/main/resources/application.properties` - Added Stripe configuration

## Next Steps

1. **Build the project**

   ```bash
   mvn clean install
   ```

2. **Run database migrations**
   - Execute SQL script: `002_create_payment_and_ticket_tables.sql`
   - Or let Hibernate auto-create tables via JPA

3. **Start the application**

   ```bash
   mvn spring-boot:run
   ```

4. **Test endpoints**
   - Use Postman or curl to test payment flow
   - Use Stripe test cards: 4242 4242 4242 4242 (success)

5. **Implement additional features**
   - PDF ticket generation
   - Email notifications
   - Webhook handling
   - Advanced analytics

## References

- [Stripe Java SDK Documentation](https://stripe.com/docs/stripe-js)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Data JPA Documentation](https://spring.io/projects/spring-data-jpa)
- [Stripe PaymentIntent API](https://stripe.com/docs/payments/payment-intents)
