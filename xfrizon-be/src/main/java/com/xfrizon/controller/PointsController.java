package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.PointsTransactionResponse;
import com.xfrizon.dto.PointsWalletResponse;
import com.xfrizon.dto.RedeemRequest;
import com.xfrizon.dto.RedemptionOrderResponse;
import com.xfrizon.service.PointsService;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/points")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class PointsController {

    private final PointsService pointsService;
    private final JwtTokenProvider jwtTokenProvider;

    /** GET /api/v1/points/wallet — current user's wallet */
    @GetMapping("/wallet")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PointsWalletResponse>> getWallet(HttpServletRequest req) {
        try {
            Long userId = extractUserId(req);
            return ResponseEntity.ok(ApiResponse.success(pointsService.getWallet(userId), "Wallet retrieved"));
        } catch (Exception e) {
            log.error("getWallet error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    /** GET /api/v1/points/ledger — transaction history */
    @GetMapping("/ledger")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<PointsTransactionResponse>>> getLedger(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest req) {
        try {
            Long userId = extractUserId(req);
            return ResponseEntity.ok(ApiResponse.success(
                    pointsService.getLedger(userId, PageRequest.of(page, size)), "Ledger retrieved"));
        } catch (Exception e) {
            log.error("getLedger error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    /** POST /api/v1/points/redeem — redeem points for a partner offer */
    @PostMapping("/redeem")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RedemptionOrderResponse>> redeem(
            @Valid @RequestBody RedeemRequest request,
            HttpServletRequest req) {
        try {
            Long userId = extractUserId(req);
            RedemptionOrderResponse result = pointsService.redeem(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(result, "Points redeemed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("redeem error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    /** GET /api/v1/points/redemptions — user's redemption history */
    @GetMapping("/redemptions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<RedemptionOrderResponse>>> getMyRedemptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest req) {
        try {
            Long userId = extractUserId(req);
            return ResponseEntity.ok(ApiResponse.success(
                    pointsService.getMyRedemptions(userId, PageRequest.of(page, size)), "Redemptions retrieved"));
        } catch (Exception e) {
            log.error("getMyRedemptions error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    private Long extractUserId(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return jwtTokenProvider.getUserIdFromToken(bearer.substring(7));
        }
        throw new IllegalArgumentException("Missing or invalid token");
    }
}
