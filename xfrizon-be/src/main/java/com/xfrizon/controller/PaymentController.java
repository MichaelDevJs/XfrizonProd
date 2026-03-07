package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.CreatePaymentIntentRequest;
import com.xfrizon.dto.PaymentIntentResponse;
import com.xfrizon.service.PaymentService;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class PaymentController {

    private final PaymentService paymentService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Create a Stripe PaymentIntent for ticket purchase
     */
    @PostMapping("/create-intent")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaymentIntentResponse>> createPaymentIntent(
            @Valid @RequestBody CreatePaymentIntentRequest request,
            HttpServletRequest httpRequest) {
        try {
            log.info("Creating payment intent for event: {}", request.getEventId());

            Long userId = extractUserIdFromToken(httpRequest);
            PaymentIntentResponse response = paymentService.createPaymentIntent(userId, request);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Payment intent created successfully"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (IllegalStateException e) {
            log.error("Payment gateway configuration error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error("Payment service is temporarily unavailable. Please try again later.", 503));
        } catch (Exception e) {
            log.error("Error creating payment intent", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create payment intent. Please try again.", 500));
        }
    }

    /**
     * Confirm payment status
     */
    @PostMapping("/{intentId}/confirm")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> confirmPayment(
            @PathVariable String intentId) {
        try {
            log.info("Confirming payment for intent: {}", intentId);

            var paymentRecord = paymentService.confirmPaymentStatus(intentId);

            return ResponseEntity.ok()
                    .body(ApiResponse.success(paymentRecord, "Payment confirmed"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error confirming payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to confirm payment: " + e.getMessage(), 500));
        }
    }

    /**
     * Get payment record details
     */
    @GetMapping("/{intentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> getPayment(
            @PathVariable String intentId) {
        try {
            log.info("Fetching payment for intent: {}", intentId);

            var paymentRecord = paymentService.getPaymentRecord(intentId);

            return ResponseEntity.ok()
                    .body(ApiResponse.success(paymentRecord, "Payment retrieved successfully"));

        } catch (IllegalArgumentException e) {
            log.warn("Payment not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Payment not found", 404));
        } catch (Exception e) {
            log.error("Error fetching payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch payment: " + e.getMessage(), 500));
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
