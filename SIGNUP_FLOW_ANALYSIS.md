# Xfrizon User Registration/Signup Flow Analysis

## Executive Summary
The Xfrizon system has a comprehensive signup flow with support for multiple user roles (USER, ORGANIZER, ADMIN, PARTNER). Email verification is partially implemented via database field but not fully utilized. The system has email service infrastructure configured but no current email sending for verification.

---

## 1. BACKEND (Java/Spring Boot) ANALYSIS

### 1.1 User Entity
**Location:** [xfrizon-be/src/main/java/com/xfrizon/entity/User.java](xfrizon-be/src/main/java/com/xfrizon/entity/User.java)

#### Key Fields:
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Basic Info
    private String firstName;
    private String lastName;
    @Column(nullable = false, unique = true)
    private String email;
    private String password;

    // Email Verification Field (EXISTS BUT NOT ACTIVELY USED)
    @Column(nullable = false)
    private Boolean isEmailVerified = false;  // ← CRITICAL: Currently defaults to false

    // Role Management
    @Enumerated(EnumType.STRING)
    private UserRole role;  // Values: USER, ORGANIZER, ADMIN, PARTNER
    
    private String roles;  // String representation of roles

    // Status
    private Boolean isActive = true;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Additional Fields
    private String phoneNumber;
    private String profilePicture;
    private String logo;
    private String location;
    private String address;
    private String website;
    private String bio;
    private String coverPhoto;
    private String favoriteArtists;
    private String media;

    // Payout & Bank Details
    private String stripeAccountId;
    private PayoutCadence payoutCadence;  // WEEKLY default
    private Boolean prefersManualPayout;
    private String bankName;
    private String accountHolderName;
    private String iban;
    private String bicSwift;
    private String accountNumber;
    private Boolean bankDetailsVerified;

    // Verification Status
    @Enumerated(EnumType.STRING)
    private VerificationStatus verificationStatus;  // PENDING default
    private LocalDateTime verifiedAt;
    private Long verifiedByAdminId;
    private String verificationNotes;

    // Fraud Detection
    @Enumerated(EnumType.STRING)
    private FraudRiskLevel fraudRiskLevel;  // LOW default
    private String fraudFlags;  // JSON array
    private LocalDateTime lastFraudCheckAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
}
```

#### Email Verification Status:
- ✅ **Field exists:** `isEmailVerified` (Boolean, defaults to `false`)
- ❌ **NOT currently implemented:** No email verification workflow exists
- **Current behavior:** All users start with `isEmailVerified = false` and are never transitioned to `true`

#### User Roles Available:
```
USER        → Regular ticket buyer
ORGANIZER   → Event creator
ADMIN       → System administrator
PARTNER     → Reward partner
```

---

### 1.2 Registration/Signup Endpoints
**Location:** [xfrizon-be/src/main/java/com/xfrizon/controller/AuthController.java](xfrizon-be/src/main/java/com/xfrizon/controller/AuthController.java)

#### Available Endpoints:

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/api/v1/auth/register` | POST | User signup | RegisterRequest | AuthResponse |
| `/api/v1/auth/register-organizer` | POST | Organizer signup | RegisterRequest | AuthResponse |
| `/api/v1/auth/register-admin` | POST | Admin signup (requires secret key) | RegisterRequest | AuthResponse |
| `/api/v1/auth/login` | POST | User login | LoginRequest | AuthResponse |
| `/api/v1/auth/admin-login` | POST | Admin login | LoginRequest | AuthResponse |
| `/api/v1/auth/oauth/google/complete-signup` | POST | Complete Google signup | GoogleSignupCompleteRequest | AuthResponse |
| `/api/v1/auth/user` | GET | Get current user | - | UserResponse |

#### CORS Configuration:
```java
@CrossOrigin(origins = {
    "http://localhost:5173", 
    "http://localhost:5177", 
    "http://localhost:3000"
}, maxAge = 3600)
```

---

### 1.3 Registration Request/Response DTOs

#### RegisterRequest.java
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    private String phoneNumber;
    private String profilePicture;  // For organizer logo/avatar

    @JsonAlias({"ref", "referral", "referral_code"})
    private String referralCode;
}
```

#### AuthResponse.java
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;              // JWT Bearer token
    private String type = "Bearer";
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String name;
    private String role;               // USER, ORGANIZER, ADMIN, PARTNER
    private String roles;
    private String message;            // Success/error message
    private Boolean success;
    private String logo;
    private String profilePicture;
    private String phoneNumber;
    private String location;
    private String address;
    private String bio;
    private String coverPhoto;
}
```

#### LoginRequest.java
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
```

---

### 1.4 AuthService Implementation
**Location:** [xfrizon-be/src/main/java/com/xfrizon/service/AuthService.java](xfrizon-be/src/main/java/com/xfrizon/service/AuthService.java)

#### Registration Logic Flow:

```java
public AuthResponse register(RegisterRequest request) {
    // 1. Check if email already exists
    if (userRepository.existsByEmail(request.getEmail())) {
        return AuthResponse.builder()
                .success(false)
                .message("Email already registered")
                .build();
    }

    // 2. Verify passwords match
    if (!request.getPassword().equals(request.getConfirmPassword())) {
        return AuthResponse.builder()
                .success(false)
                .message("Passwords do not match")
                .build();
    }

    // 3. Create new user with default values
    User user = User.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))  // BCrypt encrypted
            .phoneNumber(request.getPhoneNumber())
            .profilePicture(request.getProfilePicture())
            .role(User.UserRole.USER)                               // Set user role
            .roles(User.UserRole.USER.name())                       // "USER"
            .isActive(true)
            .isEmailVerified(false)                                 // ← EMAIL VERIFICATION FALSE
            .build();

    // 4. Save user to database
    User savedUser = userRepository.save(user);

    // 5. Track referral conversion if referral code provided
    referralConversionService.trackSignupConversion(
        request.getReferralCode(), 
        savedUser
    );

    // 6. Generate JWT token
    String token = jwtTokenProvider.generateToken(
        savedUser.getEmail(), 
        savedUser.getId()
    );

    // 7. Return response with token
    return AuthResponse.builder()
            .success(true)
            .message("User registered successfully")
            .token(token)
            .type("Bearer")
            .userId(savedUser.getId())
            .email(savedUser.getEmail())
            .firstName(savedUser.getFirstName())
            .lastName(savedUser.getLastName())
            .role(savedUser.getRole().toString())
            .roles(savedUser.getRoles())
            .build();
}
```

#### registerOrganizer() Logic:
- Similar to `register()` but sets role to `ORGANIZER`
- Calls same referral tracking service
- Returns organizer-specific response

#### registerAdmin() Logic:
- Requires `X-Admin-Secret-Key` header
- Secret key checked against hardcoded value: `"xfrizon-admin-2026"`
- ⚠️ **SECURITY NOTE:** Hardcoded secret should be moved to environment variables
- Sets `isEmailVerified = true` automatically (admins are pre-verified)

---

### 1.5 Email Service
**Location:** [xfrizon-be/src/main/java/com/xfrizon/service/EmailService.java](xfrizon-be/src/main/java/com/xfrizon/service/EmailService.java)

#### Current Status:
- ✅ **EmailService exists** with proper implementation
- ✅ **Spring Mail configured** via `spring-boot-starter-mail`
- ✅ **Multiple email methods available:**
  - `sendTicketConfirmationEmail()`
  - `sendPaymentConfirmationEmail()`

#### Current Usage:
- Emails sent AFTER successful ticket purchase (not on signup)
- Uses both SimpleMailMessage and MimeMessage with HTML support
- Gracefully handles disabled mail sender (null check)
- From address: `"noreply@xfrizon.com"`

#### Email Sending Code Example:
```java
public void sendTicketConfirmationEmail(UserTicketResponse ticket, User user) {
    if (mailSender == null) {
        log.debug("Email sending skipped - mail sender not configured");
        return;
    }
    
    try {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        String to = user.getEmail();
        helper.setTo(to);
        helper.setFrom("noreply@xfrizon.com");
        helper.setSubject("Your Xfrizon Ticket - " + ticket.getEvent().getTitle());

        // Build HTML content
        String htmlContent = buildTicketEmailContent(ticket, user);
        helper.setText(htmlContent, true);

        mailSender.send(message);
        log.info("Ticket confirmation email sent to: {}", to);

    } catch (MessagingException e) {
        log.error("Error sending ticket confirmation email to: {}", user.getEmail(), e);
        // Email failure doesn't block ticket purchase
    }
}
```

#### Email Service Features:
- Null-safe (supports running without mail configured)
- HTML email support
- Comprehensive error logging (doesn't throw exceptions for email failures)
- UTF-8 encoding support

---

### 1.6 Maven Dependencies (pom.xml)
**Location:** [xfrizon-be/pom.xml](xfrizon-be/pom.xml)

#### Email/Mail Related:
```xml
<!-- Spring Boot Mail Starter -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>

<!-- Email template engine -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-freemarker</artifactId>
</dependency>
```

#### Authentication/Security Related:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>

<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>

<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

#### Password Encoding:
- Uses Spring Security's default `PasswordEncoder` (BCrypt)
- Configured in Spring Security configuration

#### Database:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
```

#### Other Key Dependencies:
```xml
<dependency>
    <groupId>com.stripe</groupId>
    <artifactId>stripe-java</artifactId>
    <version>29.0.0</version>
</dependency>

<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

#### Email Library Support:
- ✅ JavaMail (via spring-boot-starter-mail)
- ✅ FreeMarker (for email templates)
- ✅ MimeMessageHelper (for HTML emails)

---

## 2. FRONTEND (React) ANALYSIS

### 2.1 Signup Components

#### Regular User Signup
**Location:** [src/pages/public/auth/Register.jsx](src/pages/public/auth/Register.jsx)

**Form Fields:**
```javascript
{
  firstName: "",        // Required, min 2 chars
  lastName: "",         // Required, min 2 chars
  email: "",           // Required, valid email format
  password: "",        // Required, min 8 chars
  confirmPassword: ""  // Required, must match password
}
```

**Features:**
- Show/hide password toggle buttons
- Real-time form validation
- Error messages for each field
- Google OAuth integration
- Referral code support (from localStorage)
- Automatic token storage on success
- Toast notifications for success/error

**API Call:**
```javascript
POST /api/v1/auth/register
{
  firstName: "string",
  lastName: "string", 
  email: "string",
  password: "string",
  confirmPassword: "string",
  referralCode: "optional"
}
```

**Settings Stored on Success:**
```javascript
localStorage.setItem("userToken", response.token);
localStorage.setItem("user", JSON.stringify({
  id: response.userId,
  email: response.email,
  firstName: response.firstName,
  lastName: response.lastName,
  role: response.role
}));
```

---

#### Organizer Signup
**Location:** [src/pages/public/auth/OrganizerSignUp.jsx](src/pages/public/auth/OrganizerSignUp.jsx)

**Form Fields:**
```javascript
{
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: ""
}
```

**API Call:**
```javascript
POST /api/v1/auth/register-organizer
{
  firstName: "string",
  lastName: "string",
  email: "string",
  password: "string",
  confirmPassword: "string",
  referralCode: "optional"
}
```

**Post-Signup Behavior:**
- Redirects to `/organizer/dashboard`
- Same token/user storage as regular user

---

#### Admin Signup
**Location:** [src/pages/admin/AdminSignUp.jsx](src/pages/admin/AdminSignUp.jsx)

**Form Fields:**
```javascript
{
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  adminSecretKey: ""  // Required for admin registration
}
```

**API Call:**
```javascript
POST /api/v1/auth/register-admin
Header: X-Admin-Secret-Key: "xfrizon-admin-2026"
{
  firstName: "string",
  lastName: "string",
  email: "string",
  password: "string",
  confirmPassword: "string"
}
```

**Storage on Success:**
```javascript
localStorage.setItem("adminToken", response.token);
localStorage.setItem("adminUser", JSON.stringify({
  id: response.userId,
  email: response.email,
  firstName: response.firstName,
  lastName: response.lastName,
  role: response.role,
  roles: response.roles,
  permissions: response.permissions
}));
```

**Post-Signup Behavior:**
- Redirects to `/admin/dashboard`

---

#### Partner Registration
**Location:** [src/pages/public/PartnerRegisterPage.jsx](src/pages/public/PartnerRegisterPage.jsx)

**Form Fields:**
```javascript
{
  name: "",              // Brand name
  description: "",
  brandLogo: "",
  industry: "FOOD",      // Dropdown
  type: "IN_PERSON",     // ONLINE, IN_PERSON, BOTH
  website: "",
  location: "",
  address: "",
  contactEmail: "",
  contactPhone: "",
  loginPassword: "",     // Optional if logged in
}
```

**API Call:**
```javascript
POST /api/v1/partners/register
```

**Logic:**
- If user NOT logged in: Creates new user with email + password
- If user logged in: Registers partner with existing user
- Auto-login after registration if new user
- Clears form on successful submission

---

### 2.2 Frontend API Service
**Location:** [src/api/authService.js](src/api/authService.js)

#### Available Methods:

```javascript
authService = {
  register: async (firstName, lastName, email, password),
  registerOrganizer: async (firstName, lastName, email, password),
  login: async (email, password),
  getCurrentUser: async (),
  updateUser: async (userData),
  validateToken: async (),
  startGoogleSignup: ({ accountType = "USER", redirectPath })
}
```

#### Internal Logic:
- Retrieves `xfrizon_referral` from localStorage
- Sends `confirmPassword: password` (mirrors password for validation)
- Handles errors with proper fallback messages
- URL scheme detection for OAuth backend origin resolution

---

### 2.3 AuthContext Integration
**Location:** [src/context/AuthContext.jsx](src/context/AuthContext.jsx)

#### Authentication State:
```javascript
{
  organizer: {
    id: Long,
    email: String,
    firstName: String,
    lastName: String,
    name: String,              // Display name
    role: String,              // USER, ORGANIZER, ADMIN, PARTNER
    roles: String,             // Comma-separated
    logo: String,
    profilePicture: String,
    phoneNumber: String,
    location: String,
    address: String,
    bio: String,
    coverPhoto: String
  }
}
```

#### AuthContext Methods:
- `register()` - User registration with referral tracking
- `login()` - User login
- `logout()` - Clear session
- `updateUser()` - Update user profile
- `isPartner()` - Role check helper

#### Session Management:
- Token stored in: `localStorage.userToken`
- User object stored in: `localStorage.user`
- Auto-validates token on app load
- 8-second timeout for validation (non-fatal on failure)
- Admin routes use separate `adminToken` storage

---

### 2.4 Frontend Signup Form Structure

#### Validation Rules:
```javascript
validateForm = () => {
  // firstName: required, min 2 chars
  // lastName: required, min 2 chars
  // email: required, valid email format (/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  // password: required, min 8 chars
  // confirmPassword: required, must match password
  return errors;  // {} if valid
}
```

#### UI Libraries Used:
- React Router for navigation
- React Icons (FaEye, FaEyeSlash, FcGoogle)
- React Toastify for notifications
- Tailwind CSS for styling

#### Form States:
- `loading` - During API call
- `errors` - Field validation errors
- `showPassword` / `showConfirmPassword` - Toggle visibility

---

### 2.5 Signup Flow Diagram

```
User visits /auth/register
         ↓
Fills form (firstName, lastName, email, password, confirmPassword)
         ↓
Frontend validates form
         ↓
POST /api/v1/auth/register (with referralCode from localStorage)
         ↓
Backend validates duplicate email
         ↓
Backend validates password match
         ↓
Backend creates User entity with:
  - BCrypt encrypted password
  - role = USER
  - isEmailVerified = false
  - isActive = true
         ↓
Backend generates JWT token
         ↓
Backend returns AuthResponse with token
         ↓
Frontend receives response
         ↓
localStorage.setItem("userToken", token)
localStorage.setItem("user", userObject)
         ↓
Redirect to /
         ↓
AuthContext validates token on mount
         ↓
User logged in, accessible throughout app
```

---

## 3. SUMMARY TABLE

| Aspect | Status | Details |
|--------|--------|---------|
| **Email Verification Field** | ✅ Exists | `User.isEmailVerified` (Boolean, default false) |
| **Email Verification Flow** | ❌ Not Implemented | Field exists but never updated |
| **Email Service** | ✅ Configured | Spring Mail configured, used for tickets only |
| **Email Libraries** | ✅ Available | JavaMail, FreeMarker |
| **JWT Tokens** | ✅ Implemented | JJWT 0.12.6 library |
| **Password Encoding** | ✅ BCrypt | Spring Security default encoder |
| **Referral Tracking** | ✅ Implemented | Automatic on signup |
| **Google OAuth** | ✅ Implemented | OAuth2 client with completion flow |
| **User Roles** | ✅ 4 Roles | USER, ORGANIZER, ADMIN, PARTNER |
| **Admin Secret Key** | ⚠️ Hardcoded | Should use environment variables |
| **CORS** | ✅ Configured | localhost:5173, 5177, 3000 |

---

## 4. KEY FINDINGS - EMAIL VERIFICATION

### Current State:
1. **Field Exists:** `User.isEmailVerified` is a database column
2. **Never Set True:** After signup, users remain unverified
3. **No Workflow:** No email verification endpoint or email sending on signup
4. **No UI Prompt:** Frontend doesn't prompt user to verify email
5. **No Enforcement:** Unverified users can access all features

### To Implement Email Verification:
**Backend Required:**
- Create token generation/validation service for email verification tokens
- Add endpoint: `POST /api/v1/auth/send-verification-email`
- Add endpoint: `GET /api/v1/auth/verify-email/{token}`
- Integrate with EmailService to send verification emails
- Update signup to either:
  - Send email immediately after signup, OR
  - Send email on first login attempt

**Frontend Required:**
- Add email verification modal/page after signup
- Show "Verify your email" prompt
- Add resend verification email button
- Prevent certain actions until email verified (optional)

---

## 5. REPOSITORY REFERENCES

**Backend:**
- Entity: [xfrizon-be/src/main/java/com/xfrizon/entity/User.java](xfrizon-be/src/main/java/com/xfrizon/entity/User.java)
- Controller: [xfrizon-be/src/main/java/com/xfrizon/controller/AuthController.java](xfrizon-be/src/main/java/com/xfrizon/controller/AuthController.java)
- Service: [xfrizon-be/src/main/java/com/xfrizon/service/AuthService.java](xfrizon-be/src/main/java/com/xfrizon/service/AuthService.java)
- Email: [xfrizon-be/src/main/java/com/xfrizon/service/EmailService.java](xfrizon-be/src/main/java/com/xfrizon/service/EmailService.java)
- DTOs: [xfrizon-be/src/main/java/com/xfrizon/dto/](xfrizon-be/src/main/java/com/xfrizon/dto/)

**Frontend:**
- User Signup: [src/pages/public/auth/Register.jsx](src/pages/public/auth/Register.jsx)
- Organizer Signup: [src/pages/public/auth/OrganizerSignUp.jsx](src/pages/public/auth/OrganizerSignUp.jsx)
- Admin Signup: [src/pages/admin/AdminSignUp.jsx](src/pages/admin/AdminSignUp.jsx)
- Auth Service: [src/api/authService.js](src/api/authService.js)
- Auth Context: [src/context/AuthContext.jsx](src/context/AuthContext.jsx)

---

## 6. NEXT STEPS FOR EMAIL VERIFICATION IMPLEMENTATION

1. **Create EmailVerificationToken entity** (JPA)
2. **Create verification token service** (generate, validate, cleanup)
3. **Create email verification endpoints** (send, verify)
4. **Integrate with EmailService** (send verification emails on signup)
5. **Add frontend email verification UI** (modal/page after signup)
6. **Add route guards** (optional: restrict access for unverified users)
7. **Add resend email functionality** (user-initiated verification resend)

All infrastructure is in place - only the verification workflow needs to be added!
