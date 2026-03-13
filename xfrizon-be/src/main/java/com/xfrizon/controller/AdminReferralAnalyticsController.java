package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.ReferralAnalyticsResponse;
import com.xfrizon.service.ReferralAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin/referrals")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminReferralAnalyticsController {

    private final ReferralAnalyticsService referralAnalyticsService;

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<ReferralAnalyticsResponse>> getReferralAnalytics(
            @RequestParam(value = "fromDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(value = "limit", defaultValue = "10") Integer limit
    ) {
        try {
            ReferralAnalyticsResponse analytics = referralAnalyticsService.getAnalytics(fromDate, toDate, limit);
            return ResponseEntity.ok(ApiResponse.success(analytics, "Referral analytics fetched successfully"));
        } catch (IllegalArgumentException ex) {
            log.warn("Invalid referral analytics request: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(ex.getMessage(), 400));
        } catch (Exception ex) {
            log.error("Failed to fetch referral analytics", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch referral analytics", 500));
        }
    }
}