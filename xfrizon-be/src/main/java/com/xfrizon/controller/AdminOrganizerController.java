package com.xfrizon.controller;

import com.xfrizon.dto.AdminOrganizerManagementRow;
import com.xfrizon.dto.ApiResponse;
import com.xfrizon.service.OrganizerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/organizers")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminOrganizerController {

    private final OrganizerService organizerService;

    @GetMapping("/management")
    public ResponseEntity<ApiResponse<List<AdminOrganizerManagementRow>>> getOrganizerManagementTable() {
        try {
            List<AdminOrganizerManagementRow> rows = organizerService.getAdminOrganizerManagementRows();
            return ResponseEntity.ok(ApiResponse.success(rows, "Organizer management data fetched successfully"));
        } catch (Exception e) {
            log.error("Failed to fetch organizer management data", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch organizer management data", 500));
        }
    }
}
