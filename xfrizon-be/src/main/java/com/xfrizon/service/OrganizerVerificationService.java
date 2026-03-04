package com.xfrizon.service;

import com.xfrizon.entity.User;
import com.xfrizon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for approving/rejecting organizers based on Stripe verification and fraud analysis
 */
@Service
@Slf4j
@Transactional
@RequiredArgsConstructor
public class OrganizerVerificationService {

    private final UserRepository userRepository;
    private final FraudDetectionService fraudDetectionService;
    private final StripeConnectService stripeConnectService;

    /**
     * Approve an organizer for operation
     */
    public User approveOrganizer(Long organizerId, Long adminId, String notes) {
        try {
            User organizer = userRepository.findById(organizerId)
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            organizer.setVerificationStatus(User.VerificationStatus.ADMIN_APPROVED);
            organizer.setVerifiedAt(LocalDateTime.now());
            organizer.setVerifiedByAdminId(adminId);
            organizer.setVerificationNotes(notes != null ? notes : "");
            organizer.setFraudRiskLevel(User.FraudRiskLevel.LOW);

            User savedOrganizer = userRepository.save(organizer);

            log.info("Organizer {} approved by admin {}. Notes: {}", organizerId, adminId, notes);

            // Fire approval event (can be used for notifications, etc.)
            fireOrganizerApprovedEvent(savedOrganizer, adminId);

            return savedOrganizer;

        } catch (Exception e) {
            log.error("Error approving organizer {}", organizerId, e);
            throw new RuntimeException("Error approving organizer: " + e.getMessage());
        }
    }

    /**
     * Reject an organizer from operating on the platform
     */
    public User rejectOrganizer(Long organizerId, Long adminId, String reason) {
        try {
            User organizer = userRepository.findById(organizerId)
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            organizer.setVerificationStatus(User.VerificationStatus.ADMIN_REJECTED);
            organizer.setVerifiedAt(LocalDateTime.now());
            organizer.setVerifiedByAdminId(adminId);
            organizer.setVerificationNotes(reason != null ? reason : "");

            User savedOrganizer = userRepository.save(organizer);

            log.warn("Organizer {} rejected by admin {}. Reason: {}", organizerId, adminId, reason);

            // Fire rejection event
            fireOrganizerRejectedEvent(savedOrganizer, adminId, reason);

            return savedOrganizer;

        } catch (Exception e) {
            log.error("Error rejecting organizer {}", organizerId, e);
            throw new RuntimeException("Error rejecting organizer: " + e.getMessage());
        }
    }

    /**
     * Suspend an organizer (set to SUSPENDED status)
     */
    public User suspendOrganizer(Long organizerId, Long adminId, String reason) {
        try {
            User organizer = userRepository.findById(organizerId)
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            organizer.setVerificationStatus(User.VerificationStatus.SUSPENDED);
            organizer.setVerificationNotes(reason != null ? reason : "");

            User savedOrganizer = userRepository.save(organizer);

            log.warn("Organizer {} suspended by admin {}. Reason: {}", organizerId, adminId, reason);

            fireOrganizerSuspendedEvent(savedOrganizer, adminId, reason);

            return savedOrganizer;

        } catch (Exception e) {
            log.error("Error suspending organizer {}", organizerId, e);
            throw new RuntimeException("Error suspending organizer: " + e.getMessage());
        }
    }

    /**
     * Run fraud analysis on an organizer and return result
     */
    public FraudDetectionService.FraudAnalysisResult runFraudDetection(Long organizerId) {
        return fraudDetectionService.analyzeFraudRisk(organizerId);
    }

    /**
     * Get verification status for an organizer
     */
    public VerificationStatus getVerificationStatus(Long organizerId) {
        Optional<User> organizer = userRepository.findById(organizerId);
        if (organizer.isEmpty()) {
            throw new IllegalArgumentException("Organizer not found");
        }

        User org = organizer.get();
        return VerificationStatus.builder()
                .organizerId(organizerId)
                .verificationStatus(org.getVerificationStatus())
                .fraudRiskLevel(org.getFraudRiskLevel())
                .fraudFlags(org.getFraudFlags())
                .verifiedAt(org.getVerifiedAt())
                .verifiedByAdminId(org.getVerifiedByAdminId())
                .verificationNotes(org.getVerificationNotes())
                .lastFraudCheckAt(org.getLastFraudCheckAt())
                .build();
    }

    /**
     * Check if an organizer can perform actions on the platform
     */
    public boolean isOrganizerAllowedToOperate(Long organizerId) {
        Optional<User> organizer = userRepository.findById(organizerId);
        if (organizer.isEmpty()) {
            return false;
        }

        User.VerificationStatus status = organizer.get().getVerificationStatus();
        return status.equals(User.VerificationStatus.ADMIN_APPROVED);
    }

    /**
     * Auto-approve based on low fraud risk
     */
    public Optional<User> autoApproveIfLowRisk(Long organizerId, Long systemAdminId) {
        try {
            User organizer = userRepository.findById(organizerId)
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            // Only auto-approve if Stripe verification is complete
            if (!organizer.getVerificationStatus().equals(User.VerificationStatus.STRIPE_VERIFIED)) {
                log.info("Cannot auto-approve organizer {}: Stripe verification not complete", organizerId);
                return Optional.empty();
            }

            // Run fraud detection
            FraudDetectionService.FraudAnalysisResult fraudAnalysis = fraudDetectionService.analyzeFraudRisk(organizerId);

            // Auto-approve only if LOW risk
            if (fraudAnalysis.getRiskLevel().equals(User.FraudRiskLevel.LOW)) {
                User approved = approveOrganizer(organizerId, systemAdminId, 
                    "Auto-approved - Low fraud risk score: " + fraudAnalysis.getRiskScore());
                log.info("Auto-approved organizer {} due to low fraud risk", organizerId);
                return Optional.of(approved);
            } else {
                log.info("Cannot auto-approve organizer {}: Fraud risk is {}", organizerId, fraudAnalysis.getRiskLevel());
                return Optional.empty();
            }

        } catch (Exception e) {
            log.error("Error in auto-approve for organizer {}", organizerId, e);
            return Optional.empty();
        }
    }

    // Event firing methods for notifications, auditing, etc.
    private void fireOrganizerApprovedEvent(User organizer, Long adminId) {
        // Placeholder for event publishing
        // Can integrate with Spring Events, Kafka, or custom notification service
        log.info("Event: Organizer approved - OrganizerId: {}, ApprovedBy: {}", organizer.getId(), adminId);
    }

    private void fireOrganizerRejectedEvent(User organizer, Long adminId, String reason) {
        // Placeholder for event publishing
        log.info("Event: Organizer rejected - OrganizerId: {}, RejectedBy: {}, Reason: {}", 
            organizer.getId(), adminId, reason);
    }

    private void fireOrganizerSuspendedEvent(User organizer, Long adminId, String reason) {
        // Placeholder for event publishing
        log.info("Event: Organizer suspended - OrganizerId: {}, SuspendedBy: {}, Reason: {}", 
            organizer.getId(), adminId, reason);
    }

    // DTO for verification status
    @lombok.Data
    @lombok.Builder
    public static class VerificationStatus {
        private Long organizerId;
        private User.VerificationStatus verificationStatus;
        private User.FraudRiskLevel fraudRiskLevel;
        private String fraudFlags;
        private LocalDateTime verifiedAt;
        private Long verifiedByAdminId;
        private String verificationNotes;
        private LocalDateTime lastFraudCheckAt;
    }
}
