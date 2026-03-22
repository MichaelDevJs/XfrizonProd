package com.xfrizon.service;

import com.xfrizon.dto.EmailVerificationResponse;
import com.xfrizon.entity.EmailVerificationToken;
import com.xfrizon.entity.User;
import com.xfrizon.repository.EmailVerificationTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.lang.Nullable;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@Slf4j
@Transactional
public class VerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final JavaMailSender mailSender;

    public VerificationService(EmailVerificationTokenRepository tokenRepository, @Nullable JavaMailSender mailSender) {
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
        if (mailSender == null) {
            log.warn("JavaMailSender not configured - email verification will be disabled");
        }
    }

    /**
     * Generate and send email verification token
     */
    public void sendVerificationEmail(User user) {
        try {
            // Clean up any old unverified tokens for this email
            tokenRepository.findByEmailAndIsUsedFalse(user.getEmail()).ifPresent(tokenRepository::delete);

            // Generate 6-digit verification code
            int verificationCode = generateVerificationCode();

            // Create token
            EmailVerificationToken token = EmailVerificationToken.builder()
                    .token(UUID.randomUUID().toString())
                    .email(user.getEmail())
                    .verificationCode(verificationCode)
                    .user(user)
                    .isUsed(false)
                    .build();

            tokenRepository.save(token);

            // Send email
            sendVerificationEmailConfirmation(user, verificationCode);

            log.info("Verification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Error sending verification email to: {}", user.getEmail(), e);
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    /**
     * Verify email with verification code
     */
    public EmailVerificationResponse verifyEmail(String email, Integer verificationCode) {
        try {
            // Find valid token for email
            var tokenOpt = tokenRepository.findValidTokenByEmail(email);

            if (tokenOpt.isEmpty()) {
                return EmailVerificationResponse.builder()
                        .success(false)
                        .message("Verification code expired or not found. Please request a new one.")
                        .build();
            }

            EmailVerificationToken token = tokenOpt.get();

            // Check if code matches
            if (!token.getVerificationCode().equals(verificationCode)) {
                return EmailVerificationResponse.builder()
                        .success(false)
                        .message("Invalid verification code")
                        .build();
            }

            // Check if token is expired
            if (LocalDateTime.now().isAfter(token.getExpiresAt())) {
                return EmailVerificationResponse.builder()
                        .success(false)
                        .message("Verification code expired. Please request a new one.")
                        .build();
            }

            // Mark token as used
            token.setIsUsed(true);
            token.setUsedAt(LocalDateTime.now());
            tokenRepository.save(token);

            // Mark user email as verified
            User user = token.getUser();
            user.setIsEmailVerified(true);

            log.info("Email verified for user: {}", email);

            return EmailVerificationResponse.builder()
                    .success(true)
                    .message("Email verified successfully")
                    .userId(user.getId())
                    .build();

        } catch (Exception e) {
            log.error("Error verifying email for: {}", email, e);
            return EmailVerificationResponse.builder()
                    .success(false)
                    .message("Error verifying email")
                    .build();
        }
    }

    /**
     * Resend verification code
     */
    public EmailVerificationResponse resendVerificationCode(String email, User user) {
        try {
            // Clean up old token and send new one
            tokenRepository.findByEmailAndIsUsedFalse(email).ifPresent(tokenRepository::delete);

            sendVerificationEmail(user);

            return EmailVerificationResponse.builder()
                    .success(true)
                    .message("Verification code sent to your email")
                    .build();
        } catch (Exception e) {
            log.error("Error resending verification code for: {}", email, e);
            return EmailVerificationResponse.builder()
                    .success(false)
                    .message("Failed to resend verification code")
                    .build();
        }
    }

    /**
     * Generate random 6-digit verification code
     */
    private int generateVerificationCode() {
        return new Random().nextInt(900000) + 100000; // 6-digit code
    }

    /**
     * Send verification email
     */
    private void sendVerificationEmailConfirmation(User user, Integer verificationCode) throws MessagingException {
        if (mailSender == null) {
            log.warn("Email sending skipped - mail sender not configured. Verification code for {} is: {}", user.getEmail(), verificationCode);
            return;
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(user.getEmail());
        helper.setFrom("noreply@xfrizon.com");
        helper.setSubject("Verify Your Xfrizon Email Address");

        String htmlContent = buildVerificationEmailContent(user.getFirstName(), verificationCode);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    /**
     * Build HTML content for verification email
     */
    private String buildVerificationEmailContent(String firstName, Integer verificationCode) {
        StringBuilder html = new StringBuilder();
        html.append("<html><body style='font-family: Arial, sans-serif; color: #333;'>");
        html.append("<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>");

        // Header
        html.append("<div style='text-align: center; margin-bottom: 30px;'>");
        html.append("<h1 style='color: #c0f24d; margin: 0; font-size: 32px;'>Xfrizon</h1>");
        html.append("<h2 style='color: #666; margin: 15px 0; font-size: 24px;'>Verify Your Email</h2>");
        html.append("</div>");

        // Body
        html.append("<div style='margin-bottom: 30px; line-height: 1.6;'>");
        html.append("<p>Hi ").append(firstName).append(",</p>");
        html.append("<p>Welcome to Xfrizon! Please verify your email address by entering the code below:</p>");
        html.append("</div>");

        // Verification Code
        html.append("<div style='background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center;'>");
        html.append("<p style='margin: 0; color: #999; font-size: 12px;'>VERIFICATION CODE</p>");
        html.append("<p style='margin: 10px 0; font-size: 42px; font-weight: bold; color: #c0f24d; letter-spacing: 10px;'>")
                .append(String.format("%06d", verificationCode))
                .append("</p>");
        html.append("<p style='margin: 10px 0; color: #999; font-size: 12px;'>This code expires in 24 hours</p>");
        html.append("</div>");

        // Footer
        html.append("<div style='border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #999;'>");
        html.append("<p>If you didn't create this account, please ignore this email.</p>");
        html.append("<p>© 2026 Xfrizon. All rights reserved.</p>");
        html.append("</div>");

        html.append("</div></body></html>");
        return html.toString();
    }

    /**
     * Clean up expired tokens (to be scheduled)
     */
    public void cleanupExpiredTokens() {
        try {
            tokenRepository.deleteExpiredTokens();
            log.info("Cleanup: Expired verification tokens removed");
        } catch (Exception e) {
            log.error("Error cleaning up expired verification tokens", e);
        }
    }
}
