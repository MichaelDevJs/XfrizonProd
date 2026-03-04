package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.BankDetailsRequest;
import com.xfrizon.dto.BankDetailsResponse;
import com.xfrizon.service.BankDetailsService;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/organizers/bank-details")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class BankDetailsController {

    private final BankDetailsService bankDetailsService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping
    public ResponseEntity<ApiResponse<BankDetailsResponse>> saveBankDetails(
            @Valid @RequestBody BankDetailsRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long organizerId = extractUserIdFromToken(httpRequest);
            BankDetailsResponse response = bankDetailsService.saveBankDetails(organizerId, request);
            return ResponseEntity.ok(ApiResponse.success(response, "Bank details saved successfully"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid bank details request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error saving bank details", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to save bank details: " + e.getMessage(), 500));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<BankDetailsResponse>> getBankDetails(
            HttpServletRequest httpRequest) {
        try {
            Long organizerId = extractUserIdFromToken(httpRequest);
            BankDetailsResponse response = bankDetailsService.getBankDetails(organizerId);
            return ResponseEntity.ok(ApiResponse.success(response, "Bank details retrieved"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error retrieving bank details", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve bank details: " + e.getMessage(), 500));
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
