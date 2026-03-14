package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.EventPayoutPreviewResponse;
import com.xfrizon.dto.ManualPayoutRequest;
import com.xfrizon.dto.OrganizerPayoutPreviewResponse;
import com.xfrizon.entity.EventPayout;
import com.xfrizon.entity.ManualPayout;
import com.xfrizon.service.EventPayoutService;
import com.xfrizon.service.PayoutService;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/payouts")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class PayoutController {

    private final PayoutService payoutService;
    private final EventPayoutService eventPayoutService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Create a manual payout for an organizer
     * Available to admin only
     */
    @PostMapping("/manual")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ManualPayout>> createManualPayout(
            @RequestBody ManualPayoutRequest request,
            HttpServletRequest httpRequest) {
        try {
            log.info("Creating manual payout for organizer: {}", request.getOrganizerId());
            Long adminId = extractUserIdFromToken(httpRequest);
            log.info("Admin {} initiating manual payout", adminId);

            ManualPayout payout = payoutService.createManualPayout(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(payout, "Manual payout created successfully"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid manual payout request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("Data integrity error creating manual payout", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid payout data. Ensure organizer exists and required fields are valid.", 400));
        } catch (RuntimeException e) {
            log.error("Runtime error creating manual payout", e);
            String message = e.getMessage() != null ? e.getMessage() : "Failed to create payout";
            String normalizedMessage = message.startsWith("Failed to create manual payout:")
                ? message.substring("Failed to create manual payout:".length()).trim()
                : message;
                if (normalizedMessage.contains("User is not an organizer") || normalizedMessage.contains("Organizer not found")
                    || normalizedMessage.contains("Amount must be greater than zero") || normalizedMessage.contains("Description is required")
                    || normalizedMessage.contains("Organizer ID is required") || normalizedMessage.contains("Payout request is required")
                        || normalizedMessage.contains("Currency must be a 3-letter ISO code")
                    || normalizedMessage.contains("Currency must contain only letters")
                        || normalizedMessage.contains("Organizer account is inactive")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(normalizedMessage, 400));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to create payout. Check organizer role and payload fields.", 500));
        } catch (Exception e) {
            log.error("Error creating manual payout", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create payout. Check organizer role and payload fields.", 500));
        }
    }

    @GetMapping("/events/preview")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<EventPayoutPreviewResponse>>> getEventPayoutPreview(
            @RequestParam(required = false) String status,
            HttpServletRequest httpRequest) {
        try {
            Long adminId = extractUserIdFromToken(httpRequest);
            log.debug("Admin {} requesting event payout preview, status={}", adminId, status);
            List<EventPayoutPreviewResponse> rows = eventPayoutService.getAdminPreview(status);
            return ResponseEntity.ok(ApiResponse.success(rows, "Event payout preview retrieved"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error fetching event payout preview", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch event payout preview", 500));
        }
    }

    @PostMapping("/events/{payoutId}/hold")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EventPayout>> holdEventPayout(
            @PathVariable Long payoutId,
            @RequestParam(required = false) String reason,
            HttpServletRequest httpRequest) {
        try {
            extractUserIdFromToken(httpRequest);
            EventPayout payout = eventPayoutService.holdPayout(payoutId, reason);
            return ResponseEntity.ok(ApiResponse.success(payout, "Event payout held"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error holding event payout", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to hold event payout", 500));
        }
    }

    @PostMapping("/events/{payoutId}/release")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EventPayout>> releaseEventPayout(
            @PathVariable Long payoutId,
            HttpServletRequest httpRequest) {
        try {
            extractUserIdFromToken(httpRequest);
            EventPayout payout = eventPayoutService.releaseHold(payoutId);
            return ResponseEntity.ok(ApiResponse.success(payout, "Event payout released"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error releasing event payout", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to release event payout", 500));
        }
    }

    @PostMapping("/events/{payoutId}/pay-now")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EventPayout>> payEventNow(
            @PathVariable Long payoutId,
            HttpServletRequest httpRequest) {
        try {
            extractUserIdFromToken(httpRequest);
            EventPayout payout = eventPayoutService.payNow(payoutId);
            return ResponseEntity.ok(ApiResponse.success(payout, "Event payout processed"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error processing event payout", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to process event payout", 500));
        }
    }

    @PostMapping("/events/{payoutId}/retry")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EventPayout>> retryFailedEventPayout(
            @PathVariable Long payoutId,
            HttpServletRequest httpRequest) {
        try {
            extractUserIdFromToken(httpRequest);
            EventPayout payout = eventPayoutService.retryFailedPayout(payoutId);
            return ResponseEntity.ok(ApiResponse.success(payout, "Failed payout retry started"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error retrying failed event payout", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retry event payout", 500));
        }
    }

    @PostMapping("/events/retry-failed")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Integer>> retryAllFailedEventPayouts(HttpServletRequest httpRequest) {
        try {
            extractUserIdFromToken(httpRequest);
            int retried = eventPayoutService.retryAllFailedPayouts();
            return ResponseEntity.ok(ApiResponse.success(retried, "Failed payouts retried"));
        } catch (Exception e) {
            log.error("Error retrying all failed event payouts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retry failed payouts", 500));
        }
    }

    /**
     * Get all pending manual payouts
     */
    @GetMapping("/pending")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<ManualPayout>>> getPendingPayouts(
            Pageable pageable,
            HttpServletRequest httpRequest) {
        try {
            log.info("Fetching pending payouts");
            Long adminId = extractUserIdFromToken(httpRequest);
            log.debug("Admin {} requesting pending payouts", adminId);
            
            Page<ManualPayout> payouts = payoutService.getPendingPayouts(pageable);
            return ResponseEntity.ok()
                    .body(ApiResponse.success(payouts, "Pending payouts retrieved"));

        } catch (Exception e) {
            log.error("Error fetching pending payouts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch payouts: " + e.getMessage(), 500));
        }
    }

    /**
     * Get payout preview by organizer to know exact amount available to send manually.
     */
    @GetMapping("/preview")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<OrganizerPayoutPreviewResponse>>> getOrganizerPayoutPreview(
            @RequestParam(required = false, defaultValue = "WEEKLY") String cadence,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            HttpServletRequest httpRequest) {
        try {
            Long adminId = extractUserIdFromToken(httpRequest);
            log.debug("Admin {} requesting organizer payout preview, cadence={}, from={}, to={}",
                adminId, cadence, from, to);

            LocalDateTime fromDate = from != null && !from.isBlank() ? LocalDateTime.parse(from) : null;
            LocalDateTime toDate = to != null && !to.isBlank() ? LocalDateTime.parse(to) : null;

            List<OrganizerPayoutPreviewResponse> previews = payoutService
                .getOrganizerPayoutPreviews(cadence, fromDate, toDate);
            return ResponseEntity.ok(ApiResponse.success(previews, "Organizer payout preview retrieved"));
        } catch (DateTimeParseException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Invalid date format. Use ISO 8601 (e.g. 2026-03-03T00:00:00)", 400));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error fetching organizer payout preview", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch organizer payout preview", 500));
        }
    }

    /**
     * Mark a manual payout as sent
     */
    @PutMapping("/{payoutId}/sent")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ManualPayout>> markPayoutAsSent(
            @PathVariable Long payoutId,
            @RequestParam(required = false) String adminNotes,
            HttpServletRequest httpRequest) {
        try {
            log.info("Marking payout {} as sent with notes: {}", payoutId, adminNotes);
            Long adminId = extractUserIdFromToken(httpRequest);
            log.debug("Admin {} marking payout {} as sent", adminId, payoutId);

            ManualPayout payout = payoutService.markPayoutAsSent(payoutId, adminNotes);
            return ResponseEntity.ok()
                    .body(ApiResponse.success(payout, "Payout marked as sent"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid payout state: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error marking payout as sent", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update payout: " + e.getMessage(), 500));
        }
    }

    /**
     * Cancel a pending payout
     */
    @DeleteMapping("/{payoutId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ManualPayout>> cancelPayout(
            @PathVariable Long payoutId,
            @RequestParam(required = false) String reason,
            HttpServletRequest httpRequest) {
        try {
            log.info("Cancelling payout {} with reason: {}", payoutId, reason);
            Long adminId = extractUserIdFromToken(httpRequest);
            log.debug("Admin {} cancelling payout {}", adminId, payoutId);

            ManualPayout payout = payoutService.cancelPayout(payoutId, reason);
            return ResponseEntity.ok()
                    .body(ApiResponse.success(payout, "Payout cancelled"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid payout state: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error cancelling payout", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to cancel payout: " + e.getMessage(), 500));
        }
    }

    /**
     * Get payouts for a specific organizer
     */
    @GetMapping("/organizer/{organizerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<ManualPayout>>> getOrganizerPayouts(
            @PathVariable Long organizerId,
            Pageable pageable,
            HttpServletRequest httpRequest) {
        try {
            log.info("Fetching payouts for organizer: {}", organizerId);

            Page<ManualPayout> payouts = payoutService.getOrganizerPayouts(organizerId, pageable);
            return ResponseEntity.ok()
                    .body(ApiResponse.success(payouts, "Organizer payouts retrieved"));

        } catch (Exception e) {
            log.error("Error fetching organizer payouts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch payouts: " + e.getMessage(), 500));
        }
    }

    /**
     * Extract user ID from JWT token
     */
    private Long extractUserIdFromToken(HttpServletRequest request) {
        String token = getTokenFromRequest(request);
        if (token != null) {
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new IllegalArgumentException("Invalid or missing token");
    }

    /**
     * Get JWT token from request header
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
