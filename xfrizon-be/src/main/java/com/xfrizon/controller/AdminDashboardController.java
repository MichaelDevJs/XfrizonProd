package com.xfrizon.controller;

import com.xfrizon.dto.AdminDashboardSummaryResponse;
import com.xfrizon.dto.ApiResponse;
import com.xfrizon.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AdminDashboardSummaryResponse>> getSummary() {
        try {
            AdminDashboardSummaryResponse summary = adminDashboardService.getSummary();
            return ResponseEntity.ok(ApiResponse.success(summary, "Admin dashboard summary fetched successfully"));
        } catch (Exception ex) {
            log.error("Failed to fetch admin dashboard summary", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch admin dashboard summary", 500));
        }
    }
}