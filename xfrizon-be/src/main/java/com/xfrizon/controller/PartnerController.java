package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.PartnerRegistrationRequest;
import com.xfrizon.dto.PartnerResponse;
import com.xfrizon.dto.RedemptionVerifyResponse;
import com.xfrizon.service.PartnerService;
import com.xfrizon.service.PointsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/partners")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class PartnerController {

    private final PartnerService partnerService;
    private final PointsService pointsService;

    /** GET /api/v1/partners — all active partners */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PartnerResponse>>> getAll(
            @RequestParam(required = false) String category) {
        try {
            List<PartnerResponse> partners = category != null
                    ? partnerService.getByCategory(category)
                    : partnerService.getAllActivePartners();
            return ResponseEntity.ok(ApiResponse.success(partners, "Partners retrieved"));
        } catch (Exception e) {
            log.error("getAll partners error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<PartnerResponse>>> search(@RequestParam(name = "q", required = false) String q) {
        try {
            return ResponseEntity.ok(ApiResponse.success(partnerService.searchByName(q), "Partners search retrieved"));
        } catch (Exception e) {
            log.error("search partners error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<PartnerResponse>> registerPartner(@Valid @RequestBody PartnerRegistrationRequest req) {
        try {
            PartnerResponse created = partnerService.registerPartner(req);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Partner registration submitted. Awaiting approval."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("register partner error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    /** GET /api/v1/partners/{id} — single partner with offers */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PartnerResponse>> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success(partnerService.getById(id), "Partner retrieved"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), 404));
        } catch (Exception e) {
            log.error("getById partner error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    /**
     * GET /api/v1/partners/verify/{token}
     * Called by partner when they scan a user's QR code.
     * Marks the redemption as USED and returns the discount to apply.
     */
    @GetMapping("/verify/{token}")
    public ResponseEntity<RedemptionVerifyResponse> verify(
            @PathVariable String token,
            @RequestHeader(name = "X-Partner-Key", required = false) String partnerKey
    ) {
        RedemptionVerifyResponse result = pointsService.verifyAndUse(token, partnerKey, partnerService);
        int status = result.isValid() ? 200 : 400;
        return ResponseEntity.status(status).body(result);
    }
}
