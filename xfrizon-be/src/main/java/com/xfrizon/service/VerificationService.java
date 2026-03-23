package com.xfrizon.service;

import com.xfrizon.dto.EmailVerificationResponse;
import com.xfrizon.entity.EmailVerificationToken;
import com.xfrizon.entity.User;
import com.xfrizon.repository.EmailVerificationTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.lang.Nullable;
import org.springframework.beans.factory.annotation.Value;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
@Transactional
public class VerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;
    private final String mailFrom;
    private final String resendApiKey;

    public VerificationService(
            EmailVerificationTokenRepository tokenRepository,
            @Nullable JavaMailSender mailSender,
            ObjectMapper objectMapper,
            @Value("${mail.from:noreply@xfrizon-ts.com}") String mailFrom,
            @Value("${resend.api.key:}") String resendApiKey
    ) {
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
        this.objectMapper = objectMapper;
        this.mailFrom = mailFrom;
        this.resendApiKey = resendApiKey;
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
            tokenRepository.deleteByEmailAndIsUsedFalse(user.getEmail());

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
        }
    }

    /**
     * Queue verification email on a worker thread so signup API can return immediately.
     */
    public void sendVerificationEmailAsync(User user) {
        CompletableFuture.runAsync(() -> {
            try {
                sendVerificationEmail(user);
            } catch (Exception e) {
                log.error("Async verification email failed for: {}", user.getEmail(), e);
            }
        });
    }

    public void sendVerificationCodeEmail(String email, String firstName, Integer verificationCode) {
        try {
            sendVerificationEmailConfirmation(email, firstName, verificationCode);
            log.info("Verification email sent to: {}", email);
        } catch (Exception e) {
            log.error("Error sending verification email to: {}", email, e);
        }
    }

    public void sendVerificationCodeEmailAsync(String email, String firstName, Integer verificationCode) {
        CompletableFuture.runAsync(() -> {
            try {
                sendVerificationEmailConfirmation(email, firstName, verificationCode);
                log.info("Async verification email sent to: {}", email);
            } catch (Exception e) {
                log.error("Async verification email failed for: {}", email, e);
            }
        });
    }

    /**
     * Verify email with verification code
     */
    public EmailVerificationResponse verifyEmail(String email, Integer verificationCode) {
        try {
            // Find valid token for email
            var tokenOpt = tokenRepository.findFirstByEmailAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                email,
                LocalDateTime.now()
            );

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
            tokenRepository.deleteByEmailAndIsUsedFalse(email);

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
        sendVerificationEmailConfirmation(user.getEmail(), user.getFirstName(), verificationCode);
    }

    private void sendVerificationEmailConfirmation(String email, String firstName, Integer verificationCode) throws MessagingException {
        String subject = "Verify Your Xfrizon Email Address";
        String htmlContent = buildVerificationEmailContent(firstName, verificationCode);

        if (mailSender == null) {
            if (sendViaResendApi(email, subject, htmlContent)) {
                return;
            }
            log.warn("Email sending skipped - mail sender not configured. Verification code for {} is: {}", email, verificationCode);
            return;
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(email);
        helper.setFrom(mailFrom);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        try {
            mailSender.send(message);
        } catch (Exception smtpError) {
            log.error("SMTP send failed for {}. Trying Resend API fallback.", email, smtpError);
            if (!sendViaResendApi(email, subject, htmlContent)) {
                if (smtpError instanceof MessagingException messagingException) {
                    throw messagingException;
                }
                MessagingException wrapped = new MessagingException("Failed to send email via SMTP and Resend API fallback");
                wrapped.setNextException(new Exception(smtpError));
                throw wrapped;
            }
        }
    }

    private boolean sendViaResendApi(String email, String subject, String htmlContent) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            return false;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("from", mailFrom);
            payload.put("to", new String[]{email});
            payload.put("subject", subject);
            payload.put("html", htmlContent);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            int status = response.statusCode();
            if (status >= 200 && status < 300) {
                log.info("Resend API email sent successfully to {}", email);
                return true;
            }

            log.error("Resend API send failed for {} with status {} and body {}", email, status, response.body());
            return false;
        } catch (Exception e) {
            log.error("Resend API fallback failed for {}", email, e);
            return false;
        }
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
