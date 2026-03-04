package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.BankDetailsResponse;
import com.xfrizon.dto.ManualPayoutResponse;
import com.xfrizon.service.BankDetailsService;
import com.xfrizon.service.PayoutService;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/manual-payouts")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminManualPayoutController {

    private final BankDetailsService bankDetailsService;
    private final PayoutService payoutService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/organizers")
    public ResponseEntity<ApiResponse<List<BankDetailsResponse>>> getOrganizersWithManualPayout(
            HttpServletRequest httpRequest) {
        try {
            // Verify admin access
            verifyAdminAccess(httpRequest);
            
            List<BankDetailsResponse> organizers = bankDetailsService.getOrganizersWithManualPayout();
            return ResponseEntity.ok(ApiResponse.success(organizers, 
                    "Retrieved organizers with manual payout preference"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid admin request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(e.getMessage(), 403));
        } catch (Exception e) {
            log.error("Error retrieving organizers", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve organizers: " + e.getMessage(), 500));
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<ManualPayoutResponse>>> getPendingPayouts(
            HttpServletRequest httpRequest) {
        try {
            verifyAdminAccess(httpRequest);
            
            List<ManualPayoutResponse> payouts = payoutService.getPendingPayoutsWithDetails();
            return ResponseEntity.ok(ApiResponse.success(payouts, 
                    "Retrieved pending manual payouts"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid admin request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(e.getMessage(), 403));
        } catch (Exception e) {
            log.error("Error retrieving pending payouts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve payouts: " + e.getMessage(), 500));
        }
    }

    @PutMapping("/{payoutId}/mark-sent")
    public ResponseEntity<ApiResponse<String>> markPayoutAsSent(
            @PathVariable Long payoutId,
            @RequestParam(required = false) String adminNotes,
            HttpServletRequest httpRequest) {
        try {
            verifyAdminAccess(httpRequest);
            
            payoutService.markPayoutAsSent(payoutId, adminNotes);
            return ResponseEntity.ok(ApiResponse.success("success", 
                    "Payout marked as sent"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error marking payout as sent", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to mark payout as sent: " + e.getMessage(), 500));
        }
    }

    @PutMapping("/organizers/{organizerId}/verify-bank")
    public ResponseEntity<ApiResponse<BankDetailsResponse>> verifyBankDetails(
            @PathVariable Long organizerId,
            @RequestParam Boolean verified,
            HttpServletRequest httpRequest) {
        try {
            verifyAdminAccess(httpRequest);
            
            BankDetailsResponse response = bankDetailsService.verifyBankDetails(organizerId, verified);
            return ResponseEntity.ok(ApiResponse.success(response, 
                    "Bank details verification updated"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error verifying bank details", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to verify bank details: " + e.getMessage(), 500));
        }
    }

    private void verifyAdminAccess(HttpServletRequest request) {
        String token = getTokenFromRequest(request);
        if (token == null) {
            throw new IllegalArgumentException("No authorization token provided");
        }
        
        // You might want to add additional role checking here
        // For now, just verify the token exists
        jwtTokenProvider.getUserIdFromToken(token);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
