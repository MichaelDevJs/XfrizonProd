package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.OrganizerProfileUpdateRequest;
import com.xfrizon.dto.UserResponse;
import com.xfrizon.dto.StripeConnectOnboardingResponse;
import com.xfrizon.dto.PayoutCadenceUpdateRequest;
import com.xfrizon.dto.UserTicketResponse;
import com.xfrizon.service.OrganizerService;
import com.xfrizon.service.StripeConnectService;
import com.xfrizon.service.TicketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/organizers")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class OrganizerController {

    private final OrganizerService organizerService;
    private final StripeConnectService stripeConnectService;
    private final TicketService ticketService;
    private final ObjectMapper objectMapper;

    /**
     * List all organizers, optionally filtered by country
     * GET /api/v1/organizers?country=Germany
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> listOrganizers(
            @RequestParam(required = false) String country) {
        try {
            log.info("Fetching organizers with country filter: {}", country);
            List<UserResponse> organizers = organizerService.listOrganizers(country);
            return ResponseEntity.ok(ApiResponse.success(organizers, "Organizers fetched successfully"));
        } catch (Exception e) {
            log.error("Error fetching organizers: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch organizers"));
        }
    }

    /**
     * Create Stripe Connect account for organizer (or get existing)
     */
    @PostMapping("/{organizerId}/stripe/onboarding")
    public ResponseEntity<StripeConnectOnboardingResponse> createStripeConnectAccount(
            @PathVariable Long organizerId) {
        try {
            log.info("Creating Stripe Connect account for organizer: {}", organizerId);
            StripeConnectOnboardingResponse response = stripeConnectService.createConnectedAccount(organizerId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for Stripe onboarding: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(StripeConnectOnboardingResponse.builder()
                            .organizerId(organizerId.toString())
                            .message("Error: " + e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("Error creating Stripe Connect account", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(StripeConnectOnboardingResponse.builder()
                            .organizerId(organizerId.toString())
                            .message("Failed to create Stripe Connect account")
                            .build());
        }
    }

    /**
     * Get Stripe onboarding link for organizer
     */
    @GetMapping("/{organizerId}/stripe/onboarding-link")
    public ResponseEntity<StripeConnectOnboardingResponse> getOnboardingLink(
            @PathVariable Long organizerId) {
        try {
            log.info("Getting onboarding link for organizer: {}", organizerId);
            StripeConnectOnboardingResponse response = stripeConnectService.getOnboardingLink(organizerId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for onboarding link: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(StripeConnectOnboardingResponse.builder()
                            .organizerId(organizerId.toString())
                            .message("Error: " + e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("Error getting onboarding link for organizer {}: {}", organizerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(StripeConnectOnboardingResponse.builder()
                            .organizerId(organizerId.toString())
                            .message("Failed to get onboarding link: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Check Stripe Connect status for organizer
     */
    @GetMapping("/{organizerId}/stripe/status")
    public ResponseEntity<StripeConnectOnboardingResponse> getConnectStatus(
            @PathVariable Long organizerId) {
        try {
            log.info("Checking Stripe Connect status for organizer: {}", organizerId);
            StripeConnectOnboardingResponse response = stripeConnectService.getConnectStatus(organizerId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for Stripe status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(StripeConnectOnboardingResponse.builder()
                            .organizerId(organizerId.toString())
                            .message("Error: " + e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("Error checking connect status for organizer {}: {}", organizerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(StripeConnectOnboardingResponse.builder()
                            .organizerId(organizerId.toString())
                            .message("Failed to check Stripe status: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Update payout cadence (WEEKLY or MONTHLY)
     */
    @PutMapping("/{organizerId}/stripe/payout-cadence")
    public ResponseEntity<StripeConnectOnboardingResponse> updatePayoutCadence(
            @PathVariable Long organizerId,
            @RequestBody PayoutCadenceUpdateRequest request) {
        try {
            log.info("Updating payout cadence for organizer {}: {}", organizerId, request.getPayoutCadence());
            StripeConnectOnboardingResponse response = stripeConnectService.updatePayoutCadence(
                    organizerId, request.getPayoutCadence());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid payout cadence: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(StripeConnectOnboardingResponse.builder()
                            .organizerId(organizerId.toString())
                            .message("Error: " + e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("Error updating payout cadence", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(StripeConnectOnboardingResponse.builder()
                            .organizerId(organizerId.toString())
                            .message("Failed to update payout cadence")
                            .build());
        }
    }

    /**
     * Opt for manual payouts (admin-processed)
     */
    @PostMapping("/{organizerId}/payout/manual-opt-in")
    public ResponseEntity<?> optForManualPayouts(@PathVariable Long organizerId) {
        try {
            log.info("Organizer {} opting for manual payouts", organizerId);
            organizerService.setManualPayoutPreference(organizerId, true);
            return ResponseEntity.ok().body(ApiResponse.success(null, "Successfully opted for manual payouts"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Error setting manual payout preference", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update payout preference"));
        }
    }

    /**
     * Get organizer profile
     */
    @GetMapping("/{organizerId}")
    public ResponseEntity<UserResponse> getOrganizerProfile(@PathVariable Long organizerId) {
        try {
            UserResponse organizer = organizerService.getOrganizerProfile(organizerId);
            if (organizer == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.ok(organizer);
        } catch (Exception e) {
            log.error("Error fetching organizer profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update organizer profile
     */
    @PutMapping("/{organizerId}")
    public ResponseEntity<?> updateOrganizerProfile(
            @PathVariable Long organizerId,
            @RequestBody OrganizerProfileUpdateRequest updateData) {
        try {
            log.info("Updating organizer {} with data: {}", organizerId, updateData);
            UserResponse updatedOrganizer = organizerService.updateOrganizerProfile(organizerId, updateData);
            if (updatedOrganizer == null) {
                log.warn("Organizer {} not found", organizerId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            log.info("Successfully updated organizer {}", organizerId);
            return ResponseEntity.ok(updatedOrganizer);
        } catch (IllegalArgumentException e) {
            log.warn("Validation error updating organizer profile: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(false, e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating organizer profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(false, "Failed to update profile: " + e.getMessage()));
        }
    }

    /**
     * Upload organizer cover photo
     */
    @PostMapping("/{organizerId}/cover-photo")
    public ResponseEntity<?> uploadCoverPhoto(
            @PathVariable Long organizerId,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            String coverPhotoUrl = organizerService.uploadCoverPhoto(organizerId, file);
            return ResponseEntity.ok().body(new UploadResponse(
                    coverPhotoUrl,
                    file.getOriginalFilename(),
                    file.getSize()
            ));
        } catch (Exception e) {
            log.error("Error uploading cover photo", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload cover photo: " + e.getMessage());
        }
    }

    /**
     * Upload organizer media
     */
    @PostMapping("/{organizerId}/media")
    public ResponseEntity<?> uploadMedia(
            @PathVariable Long organizerId,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            String mediaUrl = organizerService.uploadMedia(organizerId, file);
            return ResponseEntity.ok().body(new UploadResponse(
                    mediaUrl,
                    file.getOriginalFilename(),
                    file.getSize()
            ));
        } catch (IllegalArgumentException e) {
            log.warn("Validation error uploading media for organizer {}: {}", organizerId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(false, e.getMessage()));
        } catch (Exception e) {
            log.error("Error uploading media", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload media: " + e.getMessage());
        }
    }

    /**
     * Get recently bought tickets for organizer's events
     */
    @GetMapping("/{organizerId}/recent-tickets")
    public ResponseEntity<?> getRecentTickets(
            @PathVariable Long organizerId,
            @RequestParam(defaultValue = "50") int limit) {
        try {
            log.info("Fetching recent tickets for organizer: {}", organizerId);
            var tickets = ticketService.getRecentTicketsForOrganizer(organizerId, limit);
            return ResponseEntity.ok().body(ApiResponse.success(tickets, "Recent tickets fetched successfully"));
        } catch (Exception e) {
            log.error("Error fetching recent tickets for organizer {}: {}", organizerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch recent tickets: " + e.getMessage(), 500));
        }
    }

    /**
     * Validate ticket using ticket number/validation code from scanner
     */
    @PostMapping("/{organizerId}/validate-ticket")
    public ResponseEntity<?> validateTicket(
            @PathVariable Long organizerId,
            @RequestBody Map<String, String> request) {
        try {
            String ticketNumber = request != null ? request.get("ticketNumber") : null;
            if (ticketNumber == null || ticketNumber.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("ticketNumber is required", 400));
            }

            UserTicketResponse validatedTicket = ticketService.validateTicketForOrganizer(organizerId, ticketNumber);
            return ResponseEntity.ok(ApiResponse.success(validatedTicket, "Ticket validated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error validating ticket for organizer {}", organizerId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to validate ticket", 500));
        }
    }

    /**
     * Simple response class for upload operations
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UploadResponse {
        private String url;
        private String filename;
        private long size;
    }

    /**
     * Error response class
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ErrorResponse {
        private boolean success;
        private String message;
    }
}
