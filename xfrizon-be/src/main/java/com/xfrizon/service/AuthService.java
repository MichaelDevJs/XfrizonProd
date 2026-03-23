package com.xfrizon.service;

import com.xfrizon.dto.LoginRequest;
import com.xfrizon.dto.RegisterRequest;
import com.xfrizon.dto.AuthResponse;
import com.xfrizon.dto.GoogleSignupCompleteRequest;
import com.xfrizon.dto.UserResponse;
import com.xfrizon.dto.EmailVerificationRequest;
import com.xfrizon.dto.EmailVerificationResponse;
import com.xfrizon.dto.ResendVerificationRequest;
import com.xfrizon.entity.PendingUserRegistration;
import com.xfrizon.entity.Partner;
import com.xfrizon.entity.User;
import com.xfrizon.repository.PendingUserRegistrationRepository;
import com.xfrizon.repository.PartnerRepository;
import com.xfrizon.repository.UserRepository;
import com.xfrizon.util.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Locale;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@AllArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PartnerRepository partnerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;
    private final ReferralConversionService referralConversionService;
    private final VerificationService verificationService;
    private final PendingUserRegistrationRepository pendingUserRegistrationRepository;

    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        User existingUser = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (existingUser != null) {
            if (!Boolean.TRUE.equals(existingUser.getIsEmailVerified())) {
                verificationService.sendVerificationEmailAsync(existingUser);
                return AuthResponse.builder()
                        .success(true)
                        .message("Account already exists but is not verified. We sent a new verification code to your email.")
                        .userId(existingUser.getId())
                        .email(existingUser.getEmail())
                        .firstName(existingUser.getFirstName())
                        .lastName(existingUser.getLastName())
                        .role(existingUser.getRole().toString())
                        .roles(existingUser.getRoles())
                        .emailVerificationPending(true)
                        .build();
            }

            return AuthResponse.builder()
                    .success(false)
                    .message("Email already registered")
                    .build();
        }

            cleanupExpiredPendingRegistrations();

        // Verify passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Passwords do not match")
                    .build();
        }

                PendingUserRegistration pending = upsertPendingRegistration(request, User.UserRole.USER);
                verificationService.sendVerificationCodeEmail(
                    pending.getEmail(),
                    pending.getFirstName(),
                    pending.getVerificationCode()
                );

        return AuthResponse.builder()
                .success(true)
                .message("User registered successfully. Please check your email to verify your account.")
                    .email(pending.getEmail())
                    .firstName(pending.getFirstName())
                    .lastName(pending.getLastName())
                    .role(pending.getRole())
                    .roles(pending.getRoles())
                .emailVerificationPending(true)
                .build();
    }

    public AuthResponse registerOrganizer(RegisterRequest request) {
        // Check if email already exists
        User existingUser = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (existingUser != null) {
            if (!Boolean.TRUE.equals(existingUser.getIsEmailVerified())) {
                verificationService.sendVerificationEmailAsync(existingUser);
                return AuthResponse.builder()
                        .success(true)
                        .message("Organizer account exists but is not verified. We sent a new verification code to your email.")
                        .userId(existingUser.getId())
                        .email(existingUser.getEmail())
                        .firstName(existingUser.getFirstName())
                        .lastName(existingUser.getLastName())
                        .role(existingUser.getRole().toString())
                        .roles(existingUser.getRoles())
                        .emailVerificationPending(true)
                        .build();
            }

            return AuthResponse.builder()
                    .success(false)
                    .message("Email already registered")
                    .build();
        }

            cleanupExpiredPendingRegistrations();

        // Verify passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Passwords do not match")
                    .build();
        }

                PendingUserRegistration pending = upsertPendingRegistration(request, User.UserRole.ORGANIZER);
                verificationService.sendVerificationCodeEmail(
                    pending.getEmail(),
                    pending.getFirstName(),
                    pending.getVerificationCode()
                );

        return AuthResponse.builder()
                .success(true)
                .message("Organizer registered successfully. Please check your email to verify your account.")
                    .email(pending.getEmail())
                    .firstName(pending.getFirstName())
                    .lastName(pending.getLastName())
                    .role(pending.getRole())
                    .roles(pending.getRoles())
                .emailVerificationPending(true)
                .build();
    }

    public AuthResponse registerAdmin(RegisterRequest request, String adminSecretKey) {
        // Verify admin secret key (simple security measure)
        String expectedSecretKey = "xfrizon-admin-2026"; // In production, use environment variable
        if (!expectedSecretKey.equals(adminSecretKey)) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid admin secret key")
                    .build();
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Email already registered")
                    .build();
        }

        // Verify passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Passwords do not match")
                    .build();
        }

        // Create new admin user
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .profilePicture(request.getProfilePicture())
                .role(User.UserRole.ADMIN)
                .roles(User.UserRole.ADMIN.name())
                .isActive(true)
                .isEmailVerified(true)
                .build();

        User savedUser = userRepository.save(user);
        referralConversionService.trackSignupConversion(request.getReferralCode(), savedUser);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getId());

        return AuthResponse.builder()
                .success(true)
                .message("Admin account created successfully")
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

    public AuthResponse login(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            Partner partner = partnerRepository.findFirstByContactEmailIgnoreCase(request.getEmail())
                .orElse(null);

            return AuthResponse.builder()
                    .success(false)
                .message(partner != null
                    ? "Partner profile found, but no login account exists for this email yet"
                    : "User not found")
                    .build();
        }

        // Check if user is active
        if (!user.getIsActive()) {
            return AuthResponse.builder()
                    .success(false)
                    .message("User account is inactive")
                    .build();
        }

        // Check if email is verified (for regular users and organizers)
        if (!Boolean.TRUE.equals(user.getIsEmailVerified()) && 
            (user.getRole() == User.UserRole.USER || user.getRole() == User.UserRole.ORGANIZER)) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Email not verified. Please check your email for the verification code.")
                    .emailVerificationPending(true)
                    .userId(user.getId())
                    .email(user.getEmail())
                    .build();
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid password")
                    .build();
        }

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getId());

        return AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .name(user.getName())
                .role(user.getRole().toString())
            .roles(user.getRoles())
                .logo(user.getLogo() != null ? user.getLogo() : user.getProfilePicture())
                .profilePicture(user.getProfilePicture() != null ? user.getProfilePicture() : user.getLogo())
                .phoneNumber(user.getPhoneNumber())
                .location(user.getLocation())
                .address(user.getAddress())
                .bio(user.getBio())
                .coverPhoto(user.getCoverPhoto())
                .build();
    }

            public AuthResponse loginOrPrepareGoogleSignup(
                String email,
                String firstName,
                String lastName,
                    String profilePicture,
                    String requestedRole
            ) {
            User existingUser = userRepository.findByEmail(email).orElse(null);
            if (existingUser != null) {
                if (!Boolean.TRUE.equals(existingUser.getIsActive())) {
                return AuthResponse.builder()
                    .success(false)
                    .message("User account is inactive")
                    .build();
                }

                String token = jwtTokenProvider.generateToken(existingUser.getEmail(), existingUser.getId());
                return AuthResponse.builder()
                    .success(true)
                    .message("Google login successful")
                    .token(token)
                    .type("Bearer")
                    .userId(existingUser.getId())
                    .email(existingUser.getEmail())
                    .firstName(existingUser.getFirstName())
                    .lastName(existingUser.getLastName())
                    .name(existingUser.getName())
                    .role(existingUser.getRole().toString())
                    .roles(existingUser.getRoles())
                    .logo(existingUser.getLogo() != null ? existingUser.getLogo() : existingUser.getProfilePicture())
                    .profilePicture(existingUser.getProfilePicture() != null ? existingUser.getProfilePicture() : existingUser.getLogo())
                    .phoneNumber(existingUser.getPhoneNumber())
                    .location(existingUser.getLocation())
                    .address(existingUser.getAddress())
                    .bio(existingUser.getBio())
                    .coverPhoto(existingUser.getCoverPhoto())
                    .build();
            }

            Map<String, Object> claims = new HashMap<>();
            claims.put("firstName", safeTrim(firstName));
            claims.put("lastName", safeTrim(lastName));
            claims.put("profilePicture", safeTrim(profilePicture));
            String signupToken = jwtTokenProvider.generateOAuthSignupToken(email, claims);

            User.UserRole targetRole = parseRole(requestedRole);

            return AuthResponse.builder()
                .success(true)
                .message("Google signup profile completion required")
                .token(signupToken)
                .type("Signup")
                .email(email)
                .firstName(safeTrim(firstName))
                .lastName(safeTrim(lastName))
                .role(targetRole.name())
                .profilePicture(safeTrim(profilePicture))
                .build();
            }

            public AuthResponse completeGoogleSignup(GoogleSignupCompleteRequest request) {
            String signupToken = safeTrim(request.getSignupToken());
            if (!jwtTokenProvider.validateToken(signupToken)) {
                return AuthResponse.builder()
                    .success(false)
                    .message("Signup token is invalid or expired")
                    .build();
            }

            Claims claims = jwtTokenProvider.getClaims(signupToken);
            String purpose = String.valueOf(claims.get("purpose", String.class));
            if (!"GOOGLE_SIGNUP".equalsIgnoreCase(safeTrim(purpose))) {
                return AuthResponse.builder()
                    .success(false)
                    .message("Invalid signup token purpose")
                    .build();
            }

            String tokenEmail = safeTrim(jwtTokenProvider.getEmailFromToken(signupToken));
            String requestEmail = safeTrim(request.getEmail());
            if (!tokenEmail.equalsIgnoreCase(requestEmail)) {
                return AuthResponse.builder()
                    .success(false)
                    .message("Signup token does not match email")
                    .build();
            }

            User existingUser = userRepository.findByEmail(requestEmail).orElse(null);
            if (existingUser != null) {
                if (!Boolean.TRUE.equals(existingUser.getIsActive())) {
                return AuthResponse.builder()
                    .success(false)
                    .message("User account is inactive")
                    .build();
                }

                String token = jwtTokenProvider.generateToken(existingUser.getEmail(), existingUser.getId());
                return AuthResponse.builder()
                    .success(true)
                    .message("Google sign up already completed. Logged in successfully")
                    .token(token)
                    .type("Bearer")
                    .userId(existingUser.getId())
                    .email(existingUser.getEmail())
                    .firstName(existingUser.getFirstName())
                    .lastName(existingUser.getLastName())
                    .name(existingUser.getName())
                    .role(existingUser.getRole().toString())
                    .roles(existingUser.getRoles())
                    .logo(existingUser.getLogo() != null ? existingUser.getLogo() : existingUser.getProfilePicture())
                    .profilePicture(existingUser.getProfilePicture() != null ? existingUser.getProfilePicture() : existingUser.getLogo())
                    .phoneNumber(existingUser.getPhoneNumber())
                    .location(existingUser.getLocation())
                    .address(existingUser.getAddress())
                    .bio(existingUser.getBio())
                    .coverPhoto(existingUser.getCoverPhoto())
                    .build();
            }

            User.UserRole selectedRole = parseRole(request.getRole());
            String profilePicture = safeTrim(String.valueOf(claims.getOrDefault("profilePicture", "")));

            User user = User.builder()
                .firstName(safeTrim(request.getFirstName()))
                .lastName(safeTrim(request.getLastName()))
                .email(requestEmail)
                .password(passwordEncoder.encode(UUID.randomUUID() + "#Go0gle!"))
                .profilePicture(profilePicture.isBlank() ? null : profilePicture)
                .role(selectedRole)
                .roles(selectedRole.name())
                .isActive(true)
                .isEmailVerified(true)
                .build();

            User savedUser = userRepository.save(user);

            String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getId());
            return AuthResponse.builder()
                .success(true)
                .message("Google sign up completed successfully")
                .token(token)
                .type("Bearer")
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .role(savedUser.getRole().toString())
                .roles(savedUser.getRoles())
                .profilePicture(savedUser.getProfilePicture())
                .build();
            }

            public AuthResponse loginAdmin(LoginRequest request) {
            User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

            if (user == null) {
                return AuthResponse.builder()
                    .success(false)
                    .message("User not found")
                    .build();
            }

            if (!Boolean.TRUE.equals(user.getIsActive())) {
                return AuthResponse.builder()
                    .success(false)
                    .message("User account is inactive")
                    .build();
            }

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return AuthResponse.builder()
                    .success(false)
                    .message("Invalid password")
                    .build();
            }

                if (!hasAdminDashboardAccess(user)) {
                return AuthResponse.builder()
                    .success(false)
                    .message("Access denied. Admin dashboard role required")
                    .build();
            }

            String token = jwtTokenProvider.generateToken(user.getEmail(), user.getId());

            return AuthResponse.builder()
                .success(true)
                .message("Admin login successful")
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .name(user.getName())
                .role(user.getRole().toString())
                .roles(user.getRoles())
                .logo(user.getLogo() != null ? user.getLogo() : user.getProfilePicture())
                .profilePicture(user.getProfilePicture() != null ? user.getProfilePicture() : user.getLogo())
                .build();
            }

    public UserResponse getUserById(Long userId) {
        User user = userRepository.findByIdAndIsActiveTrue(userId)
                .orElse(null);

        if (user == null) {
            return null;
        }

        return mapToUserResponse(user);
    }

    public UserResponse updateUser(Long userId, User updateData) {
        User user = userRepository.findByIdAndIsActiveTrue(userId)
                .orElse(null);

        if (user == null) {
            return null;
        }

        if (updateData.getFirstName() != null) {
            user.setFirstName(updateData.getFirstName());
        }
        if (updateData.getLastName() != null) {
            user.setLastName(updateData.getLastName());
        }
        if (updateData.getPhoneNumber() != null) {
            user.setPhoneNumber(updateData.getPhoneNumber());
        }
        if (updateData.getLocation() != null) {
            user.setLocation(updateData.getLocation());
        }
        if (updateData.getAddress() != null) {
            user.setAddress(updateData.getAddress());
        }
        if (updateData.getProfilePicture() != null) {
            user.setProfilePicture(updateData.getProfilePicture());
        }
        if (updateData.getLogo() != null) {
            user.setLogo(updateData.getLogo());
        }
        if (updateData.getBio() != null) {
            user.setBio(updateData.getBio());
        }
        if (updateData.getCoverPhoto() != null) {
            user.setCoverPhoto(updateData.getCoverPhoto());
        }
        if (updateData.getName() != null) {
            user.setName(updateData.getName());
        }
        if (updateData.getFavoriteArtists() != null) {
            user.setFavoriteArtists(updateData.getFavoriteArtists());
        }
        if (updateData.getMedia() != null) {
            user.setMedia(updateData.getMedia());
        }

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    private UserResponse mapToUserResponse(User user) {
        List<String> favoriteArtists = null;
        List<UserResponse.MediaItem> media = null;

        // Parse favorite artists with comprehensive error handling
        if (user.getFavoriteArtists() != null && !user.getFavoriteArtists().isEmpty()) {
            try {
                favoriteArtists = objectMapper.readValue(user.getFavoriteArtists(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
            } catch (Exception e) {
                System.err.println("Error parsing favoriteArtists JSON: " + e.getMessage());
                // If parsing fails, split by comma or return empty list
                try {
                    if (user.getFavoriteArtists().contains(",")) {
                        favoriteArtists = Arrays.asList(user.getFavoriteArtists().split(","));
                    } else {
                        favoriteArtists = List.of(user.getFavoriteArtists().trim());
                    }
                } catch (Exception fallbackEx) {
                    favoriteArtists = List.of();
                }
            }
        } else {
            favoriteArtists = List.of();
        }

        // Parse media with comprehensive error handling
        if (user.getMedia() != null && !user.getMedia().isEmpty()) {
            try {
                media = objectMapper.readValue(user.getMedia(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, UserResponse.MediaItem.class));
            } catch (Exception e) {
                System.err.println("Error parsing media JSON: " + e.getMessage());
                // If parsing fails, return empty list
                media = List.of();
            }
        } else {
            media = List.of();
        }

        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .location(user.getLocation())
                .address(user.getAddress())
                .profilePicture(user.getProfilePicture())
                .logo(user.getLogo() != null ? user.getLogo() : user.getProfilePicture())
                .bio(user.getBio() != null ? user.getBio() : "")
                .coverPhoto(user.getCoverPhoto() != null ? user.getCoverPhoto() : "")
                .name(user.getName())
                .roles(user.getRoles())
                .favoriteArtists(favoriteArtists)
                .media(media)
                .role(user.getRole().toString())
                .isActive(user.getIsActive())
                .isEmailVerified(user.getIsEmailVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private User.UserRole parseRole(String role) {
        String normalizedRole = safeTrim(role).toUpperCase();
        if ("ORGANIZER".equals(normalizedRole)) {
            return User.UserRole.ORGANIZER;
        }
        return User.UserRole.USER;
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean hasAdminDashboardAccess(User user) {
        if (user == null) return false;
        if (user.getRole() == User.UserRole.ADMIN) return true;

        Set<String> roleTokens = new LinkedHashSet<>();
        if (user.getRoles() != null && !user.getRoles().isBlank()) {
            for (String token : user.getRoles().split(",")) {
                String normalized = token == null ? "" : token.trim().toUpperCase(Locale.ROOT);
                if (!normalized.isBlank()) {
                    roleTokens.add(normalized);
                }
            }
        }

        return roleTokens.contains("ADMIN") || roleTokens.contains("BLOG_WRITER");
    }

    /**
     * Verify email with verification code
     */
    public EmailVerificationResponse verifyEmail(EmailVerificationRequest request) {
        String email = safeTrim(request.getEmail());
        PendingUserRegistration pending = pendingUserRegistrationRepository
                .findByEmailIgnoreCaseAndVerificationCode(email, request.getVerificationCode())
                .orElse(null);

        if (pending != null) {
            if (pending.getExpiresAt() == null || LocalDateTime.now().isAfter(pending.getExpiresAt())) {
                return EmailVerificationResponse.builder()
                        .success(false)
                        .message("Verification code expired. Please request a new one.")
                        .build();
            }

            if (userRepository.existsByEmail(email)) {
                pendingUserRegistrationRepository.delete(pending);
                return EmailVerificationResponse.builder()
                        .success(false)
                        .message("Email already registered. Please login.")
                        .build();
            }

            User.UserRole role = User.UserRole.valueOf(pending.getRole());
            User user = User.builder()
                    .firstName(pending.getFirstName())
                    .lastName(pending.getLastName())
                    .email(pending.getEmail())
                    .password(pending.getPasswordHash())
                    .phoneNumber(pending.getPhoneNumber())
                    .profilePicture(pending.getProfilePicture())
                    .role(role)
                    .roles(pending.getRoles())
                    .isActive(true)
                    .isEmailVerified(true)
                    .build();

            User savedUser = userRepository.save(user);
            referralConversionService.trackSignupConversion(pending.getReferralCode(), savedUser);
            pendingUserRegistrationRepository.delete(pending);

            return EmailVerificationResponse.builder()
                    .success(true)
                    .message("Email verified successfully")
                    .userId(savedUser.getId())
                    .build();
        }

        return verificationService.verifyEmail(request.getEmail(), request.getVerificationCode());
    }

    /**
     * Resend verification email
     */
    public EmailVerificationResponse resendVerificationEmail(ResendVerificationRequest request) {
        String email = safeTrim(request.getEmail());
        PendingUserRegistration pending = pendingUserRegistrationRepository.findByEmailIgnoreCase(email).orElse(null);
        if (pending != null) {
            pending.setVerificationCode(generateVerificationCode());
            pending.setExpiresAt(LocalDateTime.now().plusHours(24));
            pendingUserRegistrationRepository.save(pending);

            verificationService.sendVerificationCodeEmail(
                pending.getEmail(),
                pending.getFirstName(),
                pending.getVerificationCode()
            );

            return EmailVerificationResponse.builder()
                .success(true)
                .message("Verification code sent to your email")
                .build();
        }

        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            return EmailVerificationResponse.builder()
                    .success(false)
                    .message("User not found")
                    .build();
        }

        if (Boolean.TRUE.equals(user.getIsEmailVerified())) {
            return EmailVerificationResponse.builder()
                    .success(false)
                    .message("Email is already verified")
                    .build();
        }

        return verificationService.resendVerificationCode(email, user);
    }

    private PendingUserRegistration upsertPendingRegistration(RegisterRequest request, User.UserRole role) {
        String email = safeTrim(request.getEmail()).toLowerCase(Locale.ROOT);
        PendingUserRegistration pending = pendingUserRegistrationRepository
                .findByEmailIgnoreCase(email)
                .orElseGet(PendingUserRegistration::new);

        pending.setEmail(email);
        pending.setFirstName(request.getFirstName());
        pending.setLastName(request.getLastName());
        pending.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        pending.setPhoneNumber(request.getPhoneNumber());
        pending.setProfilePicture(request.getProfilePicture());
        pending.setRole(role.name());
        pending.setRoles(role.name());
        pending.setReferralCode(safeTrim(request.getReferralCode()));
        pending.setVerificationCode(generateVerificationCode());
        pending.setExpiresAt(LocalDateTime.now().plusHours(24));

        return pendingUserRegistrationRepository.save(pending);
    }

    private int generateVerificationCode() {
        return ThreadLocalRandom.current().nextInt(100000, 1000000);
    }

    private void cleanupExpiredPendingRegistrations() {
        pendingUserRegistrationRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
}



