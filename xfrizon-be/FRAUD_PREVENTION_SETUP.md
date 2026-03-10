# Xfrizon Fraud Prevention System - Setup Guide

## Quick Start

This guide helps you set up and test the fraud prevention system.

## Backend Setup

### 1. Database Migration

The new verification fields are automatically created when Hibernate runs (ddl-auto=update).

**New Columns in `users` table**:

```sql
ALTER TABLE users ADD COLUMN verification_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE users ADD COLUMN verified_at DATETIME;
ALTER TABLE users ADD COLUMN verified_by_admin_id BIGINT;
ALTER TABLE users ADD COLUMN verification_notes TEXT;
ALTER TABLE users ADD COLUMN fraud_risk_level VARCHAR(20) DEFAULT 'LOW';
ALTER TABLE users ADD COLUMN fraud_flags LONGTEXT;
ALTER TABLE users ADD COLUMN last_fraud_check_at DATETIME;
```

_Note: If using old database, run these migrations manually or delete tables to regenerate._

### 2. Configuration

Update `application.properties` with actual webhook secret from Stripe:

```properties
stripe.webhook.secret=whsec_test_YOUR_ACTUAL_SECRET_HERE
```

### 3. Start Backend

```bash
cd xfrizon-be
.\mvnw spring-boot:run
```

**Expected Output**:

```
INFO: Xfrizon Backend API Started on port 8081
INFO: StripeWebhookController mapped to /api/v1/webhooks/stripe
INFO: AdminVerificationController mapped to /api/v1/admin/verification
```

## Webhook Configuration in Stripe

### 1. Get Webhook URL

Production: `https://yourdomain.com/api/v1/webhooks/stripe`
Local Testing: Use ngrok or Stripe CLI

### 2. Using Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → Webhooks**
3. Click **Add Endpoint**
4. Enter your webhook URL:
   - **Endpoint URL**: `https://yourdomain.com/api/v1/webhooks/stripe`
   - **Description**: "Xfrizon Fraud Detection & Verification"

5. Select events:
   - `account.updated` ✅ (Primary)
   - `account.external_account.created` ✅
   - `charge.dispute.created` ✅
   - `charge.dispute.closed` ✅

6. Click **Create endpoint**

7. **Copy webhook secret** (whsec\_...) and update in application.properties

### 3. Using Stripe CLI (for local testing)

```bash
# Install Stripe CLI from https://stripe.com/docs/stripe-cli

# Login to Stripe account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8081/api/v1/webhooks/stripe

# This will output your webhook signing secret
# Example: whsec_1234567890abcdef
```

Update config with this secret, then restart the backend.

## Testing

### Test 1: Automatic Webhook Reception

```bash
# Terminal 2 - While stripe listen is running
stripe trigger account.updated

# Terminal 1 - Check backend logs
# Should see: "Received Stripe webhook event: account.updated"
```

### Test 2: Admin API Endpoints

```bash
# Test fraud check endpoint
curl -X POST http://localhost:8081/api/v1/admin/verification/organizer/1/fraud-check \
  -H "Content-Type: application/json" \
  -H "X-Admin-Id: 1"

# Expected Response:
# {
#   "organizerId": 1,
#   "riskScore": 42,
#   "riskLevel": "LOW",
#   "fraudFlags": ["VERY_NEW_ACCOUNT", "MINIMAL_PROFILE"],
#   "recommendedAction": "MONITOR_CLOSELY"
# }
```

```bash
# Test approval endpoint
curl -X POST http://localhost:8081/api/v1/admin/verification/organizer/1/approve \
  -H "Content-Type: application/json" \
  -H "X-Admin-Id: 1" \
  -d '{"notes":"Verified via email inspection"}'

# Expected Response:
# {
#   "success": true,
#   "message": "Organizer approved successfully",
#   "organizerId": 1,
#   "status": "ADMIN_APPROVED"
# }
```

### Test 3: Frontend Admin Panel

1. Navigate to admin dashboard
2. Go to **Organizer Management → Verification System**
3. Click on an organizer
4. Click **Fraud** tab to run fraud analysis
5. Click **Stripe KYC** tab to load KYC data
6. Click **Approve** or **Reject** to test workflow

## Admin Panel Navigation

**Access URL**: `http://localhost:5173/admin/organizers/verification`

**Features**:

- Search by name or email
- Filter by verification status
- Filter by fraud risk level
- View detailed fraud analysis
- Download organizer information
- Approve/Reject/Suspend actions
- Add notes/reasons

## Monitoring & Logs

### Check Webhook Events

```bash
# View webhook history in Stripe Dashboard
# Developers → Webhooks → [Your Endpoint] → Events
```

### Check Application Logs

```bash
# In application.properties
logging.level.com.xfrizon.service.FraudDetectionService=INFO
logging.level.com.xfrizon.controller.StripeWebhookController=INFO
logging.level.com.xfrizon.service.OrganizerVerificationService=INFO
```

### Verify Field Updates

```sql
-- Check if organizer was verified
SELECT id, name, verification_status, fraud_risk_level, verified_at
FROM users
WHERE id = 1;

-- Check fraud flags
SELECT id, name, fraud_flags, last_fraud_check_at
FROM users
WHERE fraud_risk_level IN ('HIGH', 'CRITICAL');
```

##raightforward Deployment

### Production Deployment

1. **Update Environment Variables**:

   ```
   STRIPE_API_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   STRIPE_CONNECT_RETURN_URL=https://yourdomain.com/organizer/settings/payouts
   STRIPE_CONNECT_REFRESH_URL=https://yourdomain.com/organizer/settings/payouts
   ```

2. **Update Webhook URL**:
   - In Stripe Dashboard, update webhook endpoint to production URL
   - Verify/copy new production webhook secret

3. **Database**:
   - Run migrations on production database
   - Verify new columns created

4. **Build & Deploy**:

   ```bash
   .\mvnw clean package -DskipTests
   # Deploy generated JAR to production
   ```

5. **Verify Webhook**:
   - Monitor webhook delivery logs in Stripe
   - Check application logs for webhook reception
   - Test with a test organizer

## Troubleshooting

### Webhook Not Received

**Symptom**: Webhook endpoint shows "No events received"

**Solutions**:

1. Check webhook URL is accessible (public)
2. Verify webhook secret in application.properties
3. Check firewall allows POST from 3.18.0.0/16 (Stripe IPs)
4. Review webhook event logs in Stripe Dashboard

### Signature Verification Failed

**Symptom**: "Invalid signature" errors in logs

**Solution**:

1. Get correct webhook secret from Stripe (starts with `whsec_`)
2. Ensure secret matches in application.properties
3. Restart backend after updating secret

### Auto-Approval Not Triggering

**Symptom**: Organizer still shows STRIPE_VERIFIED after webhook

**Check**:

1. Fraud risk score < 30 (LOW) ?
2. Stripe account fully verified (charges_enabled + payouts_enabled) ?
3. Check logs: `fraudRiskLevel=LOW` ?
4. Manually trigger with: `POST /admin/verification/organizer/{id}/fraud-check`

### Admin Panel Not Loading Data

**Check**:

1. Backend running on port 8081?
2. CORS enabled in Spring (check application.properties)
3. Browser console for fetch errors
4. Network tab shows 200 responses?

## API Documentation

See [FRAUD_PREVENTION_SYSTEM.md](./FRAUD_PREVENTION_SYSTEM.md) for:

- Complete endpoint specifications
- Request/response examples
- Fraud detection factors
- Verification workflow diagram

## Support

For issues or questions:

1. Check logs: `tail -f logs/xfrizon.log`
2. Review debug output in browser console
3. Test webhook with `stripe trigger account.updated`
4. Verify database fields exist

---

**Status**: ✅ System Ready for Testing & Deployment
