package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.CreatePartnerOfferRequest;
import com.xfrizon.dto.CreatePartnerRequest;
import com.xfrizon.dto.PartnerApiKeyResponse;
import com.xfrizon.dto.PartnerOfferResponse;
import com.xfrizon.dto.PartnerResponse;
import com.xfrizon.service.PartnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/partners")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminPartnerController {

    private final PartnerService partnerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PartnerResponse>>> listAll() {
        try {
            return ResponseEntity.ok(ApiResponse.success(partnerService.getAllForAdmin(), "Partners retrieved"));
        } catch (Exception e) {
            log.error("list partners error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PartnerResponse>> create(
            @Valid @RequestBody CreatePartnerRequest req) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(partnerService.createPartner(req), "Partner created"));
        } catch (Exception e) {
            log.error("create partner error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PartnerResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CreatePartnerRequest req) {
        try {
            return ResponseEntity.ok(ApiResponse.success(partnerService.updatePartner(id, req), "Partner updated"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), 404));
        } catch (Exception e) {
            log.error("update partner error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggle(
            @PathVariable Long id,
            @RequestParam boolean active) {
        try {
            partnerService.togglePartnerActive(id, active);
            return ResponseEntity.ok(ApiResponse.success(null,
                    "Partner " + (active ? "activated" : "deactivated")));
        } catch (Exception e) {
            log.error("toggle partner error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    @PostMapping("/offers")
    public ResponseEntity<ApiResponse<PartnerOfferResponse>> createOffer(
            @Valid @RequestBody CreatePartnerOfferRequest req) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(partnerService.createOffer(req), "Offer created"));
        } catch (Exception e) {
            log.error("create offer error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    @PatchMapping("/offers/{offerId}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleOffer(
            @PathVariable Long offerId,
            @RequestParam boolean active) {
        try {
            partnerService.toggleOfferActive(offerId, active);
            return ResponseEntity.ok(ApiResponse.success(null,
                    "Offer " + (active ? "activated" : "deactivated")));
        } catch (Exception e) {
            log.error("toggle offer error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    @PostMapping("/{id}/rotate-key")
    public ResponseEntity<ApiResponse<PartnerApiKeyResponse>> rotateKey(@PathVariable Long id) {
        try {
            PartnerApiKeyResponse key = partnerService.rotateApiKey(id);
            return ResponseEntity.ok(ApiResponse.success(key, "Partner API key rotated"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), 404));
        } catch (Exception e) {
            log.error("rotate key error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }

    @PostMapping("/seed-defaults")
    public ResponseEntity<ApiResponse<Void>> seedDefaults() {
        try {
            partnerService.seedDefaultPartnersAndOffers();
            return ResponseEntity.ok(ApiResponse.success(null, "Default partners/offers seeded"));
        } catch (Exception e) {
            log.error("seed defaults error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage(), 500));
        }
    }
}
