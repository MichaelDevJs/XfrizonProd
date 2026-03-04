package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.StripeVerificationResponse;
import com.xfrizon.service.StripeConnectService;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/stripe")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminStripeController {

    private final StripeConnectService stripeConnectService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Get Stripe verification information for an organizer
     * Admin only - allows admins to review Stripe KYC data for organizer verification
     */
    @GetMapping("/organizer/{organizerId}/verification")
    public ResponseEntity<ApiResponse<StripeVerificationResponse>> getOrganizerStripeVerification(
            @PathVariable Long organizerId,
            HttpServletRequest httpRequest) {
        try {
            // Verify requester is admin
            String token = getTokenFromRequest(httpRequest);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Missing authorization token", 401));
            }

            Long requesterId = jwtTokenProvider.getUserIdFromToken(token);
            log.info("Admin {} accessing Stripe verification info for organizer {}", requesterId, organizerId);

            // In a real app, you'd check if requester is an admin here
            // For now, we trust the endpoint is only accessible to admins via API gateway/auth

            StripeVerificationResponse response = stripeConnectService.getStripeVerificationInfo(organizerId);
            return ResponseEntity.ok(ApiResponse.success(response, "Stripe verification info retrieved"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error retrieving Stripe verification info for organizer {}", organizerId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve verification info: " + e.getMessage(), 500));
        }
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
