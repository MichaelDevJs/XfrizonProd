# Xfrizon Fraud Prevention & Automated Verification System

## Overview

This document describes the comprehensive fraud prevention and automated verification system implemented for Xfrizon to protect against fraudulent organizers while streamlining the verification workflow.

## Architecture

The system consists of **4 integrated components**:

### 1. **Database Schema (User Entity Enhancement)**

**File**: `User.java` entity

Added 8 new fields to track verification and fraud detection:

```java
// Verification Status Tracking
VerificationStatus verificationStatus  // PENDING, STRIPE_VERIFIED, ADMIN_APPROVED, ADMIN_REJECTED, SUSPENDED
LocalDateTime verifiedAt              // When admin approved/rejected
Long verifiedByAdminId                // Which admin made the decision
String verificationNotes              // Admin comments on decision

// Fraud Detection Results
FraudRiskLevel fraudRiskLevel         // LOW, MEDIUM, HIGH, CRITICAL
String fraudFlags                     // JSON array: ["FLAG1", "FLAG2", ...]
LocalDateTime lastFraudCheckAt        // When fraud analysis last ran
```

**Enums**:

- `VerificationStatus`: PENDING → STRIPE_VERIFIED → ADMIN_APPROVED/REJECTED → SUSPENDED
- `FraudRiskLevel`: LOW, MEDIUM, HIGH, CRITICAL (auto-assigned by fraud detection)

---

### 2. **Fraud Detection Service**

**File**: `FraudDetectionService.java` (Service Layer)

**Purpose**: Automatically analyze organizers for fraud risk using multiple behavioral and profile indicators.

**Key Method**:

```java
FraudAnalysisResult analyzeFraudRisk(Long organizerId)
```

**Detection Factors**:

1. **Velocity Checks** (30 points max)
   - Very new account (< 24 hours): +30 pts
   - New account (< 7 days): +15 pts
   - Missing phone: +10 pts
   - Missing location: +10 pts
   - No org bio: +5 pts

2. **Location Anomalies** (50 points max)
   - High-risk countries (North Korea, Iran, Syria, Cuba): +50 pts
   - Suspicious location format: +20 pts

3. **Profile Completeness** (25 points max)
   - < 40% fields complete: +25 pts
   - < 60% fields complete: +10 pts

4. **Stripe Verification Status** (20 points max)
   - No Stripe account: +20 pts
   - Stripe verification pending: +10 pts

5. **Suspicious Patterns** (40 points max)
   - Suspicious email (temp, test, fake): +30 pts
   - Suspicious name (test, dummy, admin): +25 pts
   - Suspicious bio content (spam, fraud, hack): +40 pts

**Output**:

```java
FraudAnalysisResult {
  organizerId: Long,
  riskScore: Integer (0-100+),
  riskLevel: Enum (LOW/MEDIUM/HIGH/CRITICAL),
  fraudFlags: List<String>,     // Specific fraud indicators found
  recommendedAction: String      // AUTO_APPROVE, MONITOR, MANUAL_REVIEW, BLOCK
}
```

**Auto-Approval Trigger**: Organizers with LOW fraud risk after Stripe verification are auto-approved.

---

### 3. **Organizer Verification Service**

**File**: `OrganizerVerificationService.java` (Business Logic)

**Purpose**: Handle approval/rejection workflow and manage verification state transitions.

**Key Methods**:

```java
// Approve organizer for platform operation
User approveOrganizer(Long organizerId, Long adminId, String notes)
  → Sets status: ADMIN_APPROVED
  → Sets verifiedAt: now
  → Fires OrganizerApprovedEvent

// Reject organizer
User rejectOrganizer(Long organizerId, Long adminId, String reason)
  → Sets status: ADMIN_REJECTED
  → Fires OrganizerRejectedEvent
  → Prevents event creation

// Suspend organizer (enforcement)
User suspendOrganizer(Long organizerId, Long adminId, String reason)
  → Sets status: SUSPENDED
  → Blocks all organizer actions
  → Fires OrganizerSuspendedEvent

// Auto-approve if low risk
Optional<User> autoApproveIfLowRisk(Long organizerId, Long systemAdminId)
  → Requires: Stripe verification complete AND fraud risk = LOW
  → Sets status: ADMIN_APPROVED + auto-approval note

// Get current verification status
VerificationStatus getVerificationStatus(Long organizerId)
  → Returns full verification metadata

// Check operational permission
boolean isOrganizerAllowedToOperate(Long organizerId)
  → Returns true only if status = ADMIN_APPROVED
```

---

### 4. **Stripe Webhook Handler**

**File**: `StripeWebhookController.java` (Controller)

**Purpose**: Consume Stripe account.updated events to trigger verification updates and fraud analysis in real-time.

**Endpoints**:

```
POST /api/v1/webhooks/stripe
  - Verifies webhook signature
  - Routes events to handlers

GET /api/v1/webhooks/stripe/health
  - Health check endpoint
```

**Event Handlers**:

1. **account.updated**
   - Checks if account verification complete (charges_enabled + payouts_enabled)
   - Updates verification status to STRIPE_VERIFIED
   - Runs fraud detection automatically
   - Auto-approves if LOW risk detected

2. **account.external_account.created** (Payout Method)
   - Logs for payout capability updates

3. **charge.dispute.created** (Fraud Indicator)
   - Could trigger re-analysis if dispute pattern detected

4. **charge.dispute.closed** (Dispute Resolution)
   - Logs closure for audit trail

**Configuration**:

```properties
stripe.webhook.secret=whsec_test_secret_change_in_production
```

---

### 5. **Admin Verification API**

**File**: `AdminVerificationController.java` (REST API)

**Endpoints**:

```
GET  /api/v1/admin/verification/organizer/{organizerId}/stripe-info
  - Returns: StripeVerificationResponse (KYC data)
  - Provides: First name, last name, DOB, tax ID, business name, address, etc.
  - Source: Live Stripe Account API data

GET  /api/v1/admin/verification/organizer/{organizerId}/status
  - Returns: VerificationStatus DTO
  - Shows: Current verification state + fraud metadata

POST /api/v1/admin/verification/organizer/{organizerId}/fraud-check
  - Triggers: FraudDetectionService.analyzeFraudRisk()
  - Returns: FraudAnalysisResult

POST /api/v1/admin/verification/organizer/{organizerId}/approve
  - Body: { notes: String }
  - Updates: Status → ADMIN_APPROVED
  - Fires: ApprovedEvent

POST /api/v1/admin/verification/organizer/{organizerId}/reject
  - Body: { reason: String }
  - Updates: Status → ADMIN_REJECTED
  - Fires: RejectedEvent

POST /api/v1/admin/verification/organizer/{organizerId}/suspend
  - Body: { reason: String }
  - Updates: Status → SUSPENDED
  - Fires: SuspendedEvent
```

---

## Frontend Integration

### Admin UI Component

**File**: `OrganizerVerificationSystemEnhanced.jsx`

**Features**:

- **Organizer List**: Search, filter by status, filter by fraud risk
- **Detail Panel**: Overview, Stripe KYC, Fraud Analysis tabs
- **Real-time Actions**:
  - Approve/Reject buttons for PENDING/STRIPE_VERIFIED organizers
  - Suspend/Unsuspend toggle
  - Fraud analysis trigger
  - Stripe KYC data loading

- **Visual Indicators**:
  - Status icons (check, clock, X)
  - Fraud risk color coding (green/yellow/orange/red)
  - Fraud flag chips (limit 3, show +N more)
  - Risk score progress bar

**Tabs**:

1. **Overview**: Basic info, status, risk level
2. **Stripe KYC**: Full verification data from Stripe
3. **Fraud Analysis**: Risk score, flags, recommended action

---

## Verification Workflow

```
STEP 1: Organizer Stripe Setup
├─ Creates Stripe Connect account (country auto-detected)
├─ Completes Stripe onboarding (KYC collected by Stripe)
└─ Status: PENDING → STRIPE_VERIFIED

STEP 2: Webhook Trigger (automatic)
├─ Stripe: account.updated event fires
├─ Backend: StripeWebhookController receives + verifies signature
├─ Triggers: FraudDetectionService.analyzeFraudRisk()
└─ Auto-approves if LOW risk detected

STEP 3a: Admin Manual Review (if not auto-approved)
├─ Admin views organizer in admin panel
├─ Loads Stripe KYC data (KYC_VERIFIED tab)
├─ Reviews fraud analysis (FRAUD tab)
├─ Clicks: Approve / Reject

STEP 3b: Auto-Approval (if fraud risk = LOW)
├─ System automatically approves
├─ Status: ADMIN_APPROVED
├─ Note: "Auto-approved - Low fraud risk score: X"

STEP 4: Organizers Can Now:
├─ Create events
├─ Accept payments
├─ Receive payouts
└─ Operate on platform

STEP 5: Admin Enforcement (if needed)
├─ If fraud detected: Click Suspend
├─ All organizer actions blocked
├─ Status: SUSPENDED
```

---

## Fraud Detection Example

**Organizer Profile**:

- Email: `testuser123@gmail.com` (contains "test" = +30)
- Created: 1 hour ago (< 24hrs = +30)
- Phone: ❌ Missing (+10)
- Location: ❌ Missing (+10)
- Bio: Empty (+5)
- Stripe: Verified
- **Total Score: 85 → HIGH RISK**

**Recommended Action**: MANUAL_REVIEW_REQUIRED

**Flags**:

- VERY_NEW_ACCOUNT
- SUSPICIOUS_EMAIL
- MISSING_PHONE
- MISSING_LOCATION
- NO_ORGANIZATION_BIO

---

## Database Queries Reference

**Find organizers by verification status**:

```sql
SELECT * FROM users
WHERE verification_status = 'ADMIN_APPROVED';
```

**Find high-risk organizers**:

```sql
SELECT * FROM users
WHERE fraud_risk_level IN ('HIGH', 'CRITICAL')
ORDER BY last_fraud_check_at DESC;
```

**Get recently verified organizers**:

```sql
SELECT * FROM users
WHERE verification_status = 'ADMIN_APPROVED'
ORDER BY verified_at DESC
LIMIT 20;
```

---

## Configuration

**application.properties**:

```properties
# Stripe
stripe.api.key=sk_test_...
stripe.webhook.secret=whsec_test_secret_change_in_production

# Organizer Connect
xfrizon.stripe.connect.country=US
xfrizon.stripe.connect.refresh-url=http://localhost:5173/organizer/settings/payouts
xfrizon.stripe.connect.return-url=http://localhost:5173/organizer/settings/payouts?stripe=connected
```

---

## Testing Checklist

### Unit Tests

- [ ] FraudDetectionService.analyzeFraudRisk() with various flag combinations
- [ ] OrganizerVerificationService approval/rejection workflow
- [ ] VerificationStatus transitions validation

### Integration Tests

- [ ] Admin API endpoints (GET/POST verification routes)
- [ ] Webhook signature verification
- [ ] Auto-approval trigger on Stripe event

### Manual Testing

- [ ] Create test organizer with Stripe account
- [ ] Verify webhook received and processed
- [ ] View organizer in admin panel
- [ ] Approve/Reject from admin UI
- [ ] Check organizer account state after approval
- [ ] Suspend/Unsuspend functionality
- [ ] Fraud detection results match expected flags

### Security Testing

- [ ] Invalid webhook signatures rejected
- [ ] Admin endpoints require auth token
- [ ] PII data never logged in fraud analysis
- [ ] Sensitive Stripe data only visible to admins

---

## Future Enhancements

1. **Machine Learning Scoring**
   - Use historical approval data to train risk model
   - Weighted fraud indicators based on actual fraud history

2. **Advanced Velocity Checks**
   - Detect multiple accounts from same IP/email domain
   - Velocity across payment methods

3. **Device Fingerprinting**
   - Track device ID changes
   - Detect suspicious location changes

4. **Notification System**
   - Email admins for HIGH/CRITICAL fraud alerts
   - Notify organizers of approval/rejection

5. **Audit Trail**
   - Log all admin actions with IP and timestamp
   - Generate admin audit reports

6. **Integration with Third-Party**
   - Abuse.ch database checks
   - MaxMind geolocation verification
   - AVS/CVV validation for initial payment

---

## Files Modified/Created

**Backend**:

- ✅ `User.java` - Enhanced with verification fields
- ✅ `FraudDetectionService.java` - NEW
- ✅ `OrganizerVerificationService.java` - NEW
- ✅ `StripeWebhookController.java` - NEW
- ✅ `AdminVerificationController.java` - NEW
- ✅ `UserRepository.java` - Added findByStripeAccountId()
- ✅ `StripeConnectService.java` - Fixed compilation issues
- ✅ `application.properties` - Added webhook secret

**Frontend**:

- ✅ `OrganizerVerificationSystemEnhanced.jsx` - NEW (comprehensive admin UI)
- ✅ `StripeVerificationPanel.jsx` - Already created (displays KYC data)

**Total**: 1 database change, 8 Java files, 2 React components

---

## Status: ✅ IMPLEMENTATION COMPLETE

All 4 features fully implemented:

1. ✅ Automated approval/rejection workflow
2. ✅ Fraud detection system with 5 detection factors
3. ✅ Stripe webhook integration
4. ✅ Admin UI for verification management

**Next Step**: Deploy and configure webhook URL in Stripe dashboard.
