package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.EventPayoutPreviewResponse;
import com.xfrizon.dto.PayoutReportResponse;
import com.xfrizon.dto.StripeConnectStatusResponse;
import com.xfrizon.dto.StripeOnboardingResponse;
import com.xfrizon.dto.UpdatePayoutCadenceRequest;
import com.xfrizon.service.EventPayoutService;
import com.xfrizon.service.OrganizerPayoutService;
import com.xfrizon.service.StripeConnectService;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/organizers/stripe")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class OrganizerPayoutController {

    private final OrganizerPayoutService organizerPayoutService;
    private final EventPayoutService eventPayoutService;
    private final StripeConnectService stripeConnectService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/onboarding-link")
    public ResponseEntity<ApiResponse<StripeOnboardingResponse>> getOnboardingLink(
            HttpServletRequest httpRequest) {
        try {
            Long organizerId = extractUserIdFromToken(httpRequest);
            com.xfrizon.dto.StripeConnectOnboardingResponse response = stripeConnectService.getOnboardingLink(organizerId);
            // Convert to API response format
            StripeOnboardingResponse onboardingResponse = StripeOnboardingResponse.builder()
                    .stripeAccountId(response.getStripeAccountId())
                    .onboardingUrl(response.getOnboardingUrl())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(onboardingResponse, "Stripe onboarding link created"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid organizer payout request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error creating organizer Stripe onboarding link", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create onboarding link: " + e.getMessage(), 500));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<StripeConnectStatusResponse>> getConnectStatus(
            HttpServletRequest httpRequest) {
        try {
            Long organizerId = extractUserIdFromToken(httpRequest);
            com.xfrizon.dto.StripeConnectOnboardingResponse response = stripeConnectService.getConnectStatus(organizerId);
            // Convert to API response format
            StripeConnectStatusResponse statusResponse = StripeConnectStatusResponse.builder()
                    .stripeAccountId(response.getStripeAccountId())
                    .chargesEnabled(response.getChargesEnabled() != null ? response.getChargesEnabled() : false)
                    .payoutsEnabled(response.getPayoutsEnabled() != null ? response.getPayoutsEnabled() : false)
                    .detailsSubmitted(response.getChargesEnabled() != null ? response.getChargesEnabled() : false) // Use chargesEnabled as proxy for detailsSubmitted
                    .payoutCadence(response.getPayoutCadence())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(statusResponse, "Stripe Connect status fetched"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid organizer payout request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error fetching organizer Stripe status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch Stripe status: " + e.getMessage(), 500));
        }
    }

    @PutMapping("/payout-cadence")
    public ResponseEntity<ApiResponse<StripeConnectStatusResponse>> updatePayoutCadence(
            @Valid @RequestBody UpdatePayoutCadenceRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long organizerId = extractUserIdFromToken(httpRequest);
            com.xfrizon.dto.StripeConnectOnboardingResponse response =
                    stripeConnectService.updatePayoutCadence(organizerId, request.getCadence());
            // Convert to API response format
            StripeConnectStatusResponse statusResponse = StripeConnectStatusResponse.builder()
                    .stripeAccountId(response.getStripeAccountId())
                    .chargesEnabled(response.getChargesEnabled() != null ? response.getChargesEnabled() : false)
                    .payoutsEnabled(response.getPayoutsEnabled() != null ? response.getPayoutsEnabled() : false)
                    .detailsSubmitted(response.getChargesEnabled() != null ? response.getChargesEnabled() : false)
                    .payoutCadence(response.getPayoutCadence())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(statusResponse, "Payout cadence updated successfully"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid organizer payout request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error updating organizer payout cadence", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update payout cadence: " + e.getMessage(), 500));
        }
    }

    @GetMapping("/payouts/report")
    public ResponseEntity<ApiResponse<PayoutReportResponse>> getPayoutReport(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            HttpServletRequest httpRequest) {
        try {
            Long organizerId = extractUserIdFromToken(httpRequest);
            
            LocalDateTime fromDate = from != null ? java.time.LocalDateTime.parse(from) : null;
            LocalDateTime toDate = to != null ? java.time.LocalDateTime.parse(to) : null;
            
            PayoutReportResponse report = organizerPayoutService.getPayoutReport(organizerId, fromDate, toDate);
            return ResponseEntity.ok(ApiResponse.success(report, "Payout report generated"));
        } catch (java.time.format.DateTimeParseException e) {
            log.warn("Invalid date format: {}. Use ISO 8601 format", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid date format. Use ISO 8601 format (yyyy-MM-ddTHH:mm:ss)", 400));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid payout report request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error generating payout report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to generate payout report: " + e.getMessage(), 500));
        }
    }

    @GetMapping("/payouts/preview")
    public ResponseEntity<ApiResponse<java.util.List<EventPayoutPreviewResponse>>> getEventPayoutPreview(
            HttpServletRequest httpRequest) {
        try {
            Long organizerId = extractUserIdFromToken(httpRequest);
            java.util.List<EventPayoutPreviewResponse> rows = eventPayoutService.getOrganizerPreview(organizerId);
            return ResponseEntity.ok(ApiResponse.success(rows, "Event payout preview retrieved"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error loading organizer event payout preview", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to load event payout preview", 500));
        }
    }

    private Long extractUserIdFromToken(HttpServletRequest request) {
        String token = getTokenFromRequest(request);
        if (token != null) {
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new IllegalArgumentException("Invalid or missing token");
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
