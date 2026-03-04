package com.xfrizon.service;

import com.xfrizon.entity.User;
import com.xfrizon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Service for fraud detection based on Stripe verification data and platform behavior
 */
@Service
@Slf4j
@Transactional
@RequiredArgsConstructor
public class FraudDetectionService {

    private final UserRepository userRepository;

    /**
     * Analyze organizer for fraud risk based on multiple factors
     */
    public FraudAnalysisResult analyzeFraudRisk(Long organizerId) {
        try {
            User organizer = userRepository.findById(organizerId)
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            List<String> fraudFlags = new ArrayList<>();
            int riskScore = 0;

            // 1. Check velocity - new account with suspicious activity
            riskScore += checkVelocityFlags(organizer, fraudFlags);

            // 2. Check location anomalies
            riskScore += checkLocationAnomalies(organizer, fraudFlags);

            // 3. Check profile completeness
            riskScore += checkProfileCompleteness(organizer, fraudFlags);

            // 4. Check Stripe verification status
            riskScore += checkStripeVerificationStatus(organizer, fraudFlags);

            // 5. Check for suspicious patterns
            riskScore += checkSuspiciousPatterns(organizer, fraudFlags);

            User.FraudRiskLevel riskLevel = determineRiskLevel(riskScore);
            organizer.setFraudRiskLevel(riskLevel);
            organizer.setFraudFlags(String.join(",", fraudFlags));
            organizer.setLastFraudCheckAt(LocalDateTime.now());
            userRepository.save(organizer);

            log.info("Fraud analysis for organizer {}: score={}, level={}, flags={}", 
                organizerId, riskScore, riskLevel, fraudFlags);

            return FraudAnalysisResult.builder()
                    .organizerId(organizerId)
                    .riskScore(riskScore)
                    .riskLevel(riskLevel)
                    .fraudFlags(fraudFlags)
                    .recommendedAction(getRecommendedAction(riskLevel))
                    .build();

        } catch (Exception e) {
            log.error("Error analyzing fraud risk for organizer {}", organizerId, e);
            throw new RuntimeException("Error analyzing fraud risk: " + e.getMessage());
        }
    }

    /**
     * Velocity checks - detect suspicious account activity patterns
     */
    private int checkVelocityFlags(User organizer, List<String> fraudFlags) {
        int score = 0;

        // Account age less than 24 hours
        if (organizer.getCreatedAt() != null) {
            long hoursSinceCreation = ChronoUnit.HOURS.between(organizer.getCreatedAt(), LocalDateTime.now());
            if (hoursSinceCreation < 24) {
                fraudFlags.add("VERY_NEW_ACCOUNT");
                score += 30;
            } else if (hoursSinceCreation < 7 * 24) {
                fraudFlags.add("NEW_ACCOUNT");
                score += 15;
            }
        }

        // Missing critical profile information
        if (organizer.getPhoneNumber() == null || organizer.getPhoneNumber().isBlank()) {
            fraudFlags.add("MISSING_PHONE");
            score += 10;
        }

        if (organizer.getLocation() == null || organizer.getLocation().isBlank()) {
            fraudFlags.add("MISSING_LOCATION");
            score += 10;
        }

        if (organizer.getBio() == null || organizer.getBio().isBlank()) {
            fraudFlags.add("NO_ORGANIZATION_BIO");
            score += 5;
        }

        return score;
    }

    /**
     * Check for location anomalies
     */
    private int checkLocationAnomalies(User organizer, List<String> fraudFlags) {
        int score = 0;

        String location = organizer.getLocation();
        if (location == null || location.isBlank()) {
            return 0;
        }

        // Check for high-risk countries (can be customized based on compliance needs)
        String[] highRiskCountries = {"NORTH KOREA", "IRAN", "SYRIA", "CUBA"};
        String upperLocation = location.toUpperCase();

        for (String country : highRiskCountries) {
            if (upperLocation.contains(country)) {
                fraudFlags.add("HIGH_RISK_COUNTRY");
                score += 50;
                break;
            }
        }

        // Check for VPN/proxy indicators (placeholder - would need IP analysis)
        if (location.contains("Anonymous") || location.contains("Private")) {
            fraudFlags.add("SUSPICIOUS_LOCATION_FORMAT");
            score += 20;
        }

        return score;
    }

    /**
     * Check profile completeness
     */
    private int checkProfileCompleteness(User organizer, List<String> fraudFlags) {
        int completeFields = 0;
        int totalFields = 7;

        if (organizer.getName() != null && !organizer.getName().isBlank()) completeFields++;
        if (organizer.getPhoneNumber() != null && !organizer.getPhoneNumber().isBlank()) completeFields++;
        if (organizer.getLocation() != null && !organizer.getLocation().isBlank()) completeFields++;
        if (organizer.getAddress() != null && !organizer.getAddress().isBlank()) completeFields++;
        if (organizer.getBio() != null && !organizer.getBio().isBlank()) completeFields++;
        if (organizer.getLogo() != null && !organizer.getLogo().isBlank()) completeFields++;
        if (organizer.getCoverPhoto() != null && !organizer.getCoverPhoto().isBlank()) completeFields++;

        int completionPercent = (completeFields * 100) / totalFields;

        if (completionPercent < 40) {
            fraudFlags.add("INCOMPLETE_PROFILE");
            return 25;
        } else if (completionPercent < 60) {
            fraudFlags.add("MINIMAL_PROFILE");
            return 10;
        }

        return 0;
    }

    /**
     * Check Stripe verification status
     */
    private int checkStripeVerificationStatus(User organizer, List<String> fraudFlags) {
        int score = 0;

        if (organizer.getStripeAccountId() == null || organizer.getStripeAccountId().isBlank()) {
            fraudFlags.add("NO_STRIPE_ACCOUNT");
            score += 20;
        } else if (!organizer.getVerificationStatus().equals(User.VerificationStatus.STRIPE_VERIFIED)) {
            fraudFlags.add("STRIPE_VERIFICATION_PENDING");
            score += 10;
        }

        return score;
    }

    /**
     * Check for suspicious patterns
     */
    private int checkSuspiciousPatterns(User organizer, List<String> fraudFlags) {
        int score = 0;

        // Suspicious email patterns
        String email = organizer.getEmail().toLowerCase();
        if (email.contains("temp") || email.contains("test") || email.contains("fake")) {
            fraudFlags.add("SUSPICIOUS_EMAIL");
            score += 30;
        }

        // Name too generic or suspicious
        String name = organizer.getName() != null ? organizer.getName().toLowerCase() : "";
        if (name.contains("test") || name.contains("dummy") || name.contains("admin")) {
            fraudFlags.add("SUSPICIOUS_NAME");
            score += 25;
        }

        // Bio contains suspicious keywords
        String bio = organizer.getBio() != null ? organizer.getBio().toLowerCase() : "";
        String[] suspiciousKeywords = {"spam", "fraud", "hack", "exploit", "scam"};
        for (String keyword : suspiciousKeywords) {
            if (bio.contains(keyword)) {
                fraudFlags.add("SUSPICIOUS_BIO_CONTENT");
                score += 40;
                break;
            }
        }

        return score;
    }

    private User.FraudRiskLevel determineRiskLevel(int score) {
        if (score >= 100) return User.FraudRiskLevel.CRITICAL;
        if (score >= 60) return User.FraudRiskLevel.HIGH;
        if (score >= 30) return User.FraudRiskLevel.MEDIUM;
        return User.FraudRiskLevel.LOW;
    }

    private String getRecommendedAction(User.FraudRiskLevel level) {
        return switch (level) {
            case CRITICAL -> "BLOCK_IMMEDIATELY";
            case HIGH -> "MANUAL_REVIEW_REQUIRED";
            case MEDIUM -> "MONITOR_CLOSELY";
            case LOW -> "APPROVE";
        };
    }

    @lombok.Data
    @lombok.Builder
    public static class FraudAnalysisResult {
        private Long organizerId;
        private Integer riskScore;
        private User.FraudRiskLevel riskLevel;
        private List<String> fraudFlags;
        private String recommendedAction;
    }
}
