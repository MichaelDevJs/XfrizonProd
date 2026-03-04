package com.xfrizon.controller;

import com.xfrizon.dto.StripeVerificationResponse;
import com.xfrizon.entity.User;
import com.xfrizon.service.OrganizerVerificationService;
import com.xfrizon.service.StripeConnectService;
import com.xfrizon.service.FraudDetectionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Admin controller for managing organizer verification and fraud detection
 */
@RestController
@RequestMapping("/api/v1/admin/verification")
@Slf4j
@RequiredArgsConstructor
public class AdminVerificationController {

    private final OrganizerVerificationService verificationService;
    private final StripeConnectService stripeConnectService;
    private final FraudDetectionService fraudDetectionService;

    /**
     * Get organizer Stripe verification details (KYC data)
     * GET /api/v1/admin/verification/organizer/{organizerId}/stripe-info
     */
    @GetMapping("/organizer/{organizerId}/stripe-info")
    public ResponseEntity<StripeVerificationResponse> getOrganizerStripeInfo(
            @PathVariable Long organizerId) {
        try {
            log.info("Admin requesting Stripe info for organizer {}", organizerId);
            
            StripeVerificationResponse verificationInfo = 
                stripeConnectService.getStripeVerificationInfo(organizerId);
            
            return ResponseEntity.ok(verificationInfo);

        } catch (IllegalArgumentException e) {
            log.error("Organizer not found: {}", organizerId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error retrieving Stripe info for organizer {}", organizerId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get organizer verification status and fraud analysis
     * GET /api/v1/admin/verification/organizer/{organizerId}/status
     */
    @GetMapping("/organizer/{organizerId}/status")
    public ResponseEntity<OrganizerVerificationService.VerificationStatus> getVerificationStatus(
            @PathVariable Long organizerId) {
        try {
            log.info("Admin requesting verification status for organizer {}", organizerId);
            
            OrganizerVerificationService.VerificationStatus status = 
                verificationService.getVerificationStatus(organizerId);
            
            return ResponseEntity.ok(status);

        } catch (IllegalArgumentException e) {
            log.error("Organizer not found: {}", organizerId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error retrieving verification status for organizer {}", organizerId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Run fraud detection on organizer
     * POST /api/v1/admin/verification/organizer/{organizerId}/fraud-check
     */
    @PostMapping("/organizer/{organizerId}/fraud-check")
    public ResponseEntity<FraudDetectionService.FraudAnalysisResult> runFraudCheck(
            @PathVariable Long organizerId) {
        try {
            log.info("Admin running fraud check for organizer {}", organizerId);
            
            FraudDetectionService.FraudAnalysisResult result = 
                fraudDetectionService.analyzeFraudRisk(organizerId);
            
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            log.error("Organizer not found: {}", organizerId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error running fraud check for organizer {}", organizerId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Approve organizer
     * POST /api/v1/admin/verification/organizer/{organizerId}/approve
     */
    @PostMapping("/organizer/{organizerId}/approve")
    public ResponseEntity<ApprovalResponse> approveOrganizer(
            @PathVariable Long organizerId,
            @RequestBody ApprovalRequest request,
            @RequestHeader(value = "X-Admin-Id", required = false) Long adminId) {
        try {
            log.info("Admin {} approving organizer {}", adminId, organizerId);
            
            User approved = verificationService.approveOrganizer(
                organizerId, 
                adminId != null ? adminId : 0L, 
                request.getNotes()
            );
            
            return ResponseEntity.ok(ApprovalResponse.builder()
                    .success(true)
                    .message("Organizer approved successfully")
                    .organizerId(organizerId)
                    .status(approved.getVerificationStatus().toString())
                    .build());

        } catch (IllegalArgumentException e) {
            log.error("Organizer not found: {}", organizerId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error approving organizer {}", organizerId, e);
            return ResponseEntity.internalServerError().body(ApprovalResponse.builder()
                    .success(false)
                    .message("Error approving organizer: " + e.getMessage())
                    .organizerId(organizerId)
                    .build());
        }
    }

    /**
     * Reject organizer
     * POST /api/v1/admin/verification/organizer/{organizerId}/reject
     */
    @PostMapping("/organizer/{organizerId}/reject")
    public ResponseEntity<ApprovalResponse> rejectOrganizer(
            @PathVariable Long organizerId,
            @RequestBody RejectionRequest request,
            @RequestHeader(value = "X-Admin-Id", required = false) Long adminId) {
        try {
            log.info("Admin {} rejecting organizer {}", adminId, organizerId);
            
            User rejected = verificationService.rejectOrganizer(
                organizerId, 
                adminId != null ? adminId : 0L, 
                request.getReason()
            );
            
            return ResponseEntity.ok(ApprovalResponse.builder()
                    .success(true)
                    .message("Organizer rejected successfully")
                    .organizerId(organizerId)
                    .status(rejected.getVerificationStatus().toString())
                    .build());

        } catch (IllegalArgumentException e) {
            log.error("Organizer not found: {}", organizerId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error rejecting organizer {}", organizerId, e);
            return ResponseEntity.internalServerError().body(ApprovalResponse.builder()
                    .success(false)
                    .message("Error rejecting organizer: " + e.getMessage())
                    .organizerId(organizerId)
                    .build());
        }
    }

    /**
     * Suspend organizer
     * POST /api/v1/admin/verification/organizer/{organizerId}/suspend
     */
    @PostMapping("/organizer/{organizerId}/suspend")
    public ResponseEntity<ApprovalResponse> suspendOrganizer(
            @PathVariable Long organizerId,
            @RequestBody RejectionRequest request,
            @RequestHeader(value = "X-Admin-Id", required = false) Long adminId) {
        try {
            log.info("Admin {} suspending organizer {}", adminId, organizerId);
            
            User suspended = verificationService.suspendOrganizer(
                organizerId, 
                adminId != null ? adminId : 0L, 
                request.getReason()
            );
            
            return ResponseEntity.ok(ApprovalResponse.builder()
                    .success(true)
                    .message("Organizer suspended successfully")
                    .organizerId(organizerId)
                    .status(suspended.getVerificationStatus().toString())
                    .build());

        } catch (IllegalArgumentException e) {
            log.error("Organizer not found: {}", organizerId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error suspending organizer {}", organizerId, e);
            return ResponseEntity.internalServerError().body(ApprovalResponse.builder()
                    .success(false)
                    .message("Error suspending organizer: " + e.getMessage())
                    .organizerId(organizerId)
                    .build());
        }
    }

    // DTOs
    @Data
    public static class ApprovalRequest {
        private String notes;
    }

    @Data
    public static class RejectionRequest {
        private String reason;
    }

    @Data
    @lombok.Builder
    public static class ApprovalResponse {
        private Boolean success;
        private String message;
        private Long organizerId;
        private String status;
    }
}
