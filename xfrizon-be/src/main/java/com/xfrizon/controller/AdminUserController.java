package com.xfrizon.controller;

import com.xfrizon.dto.AdminUserManagementRow;
import com.xfrizon.dto.ApiResponse;
import com.xfrizon.service.AdminUserService;
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
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping({"", "/management", "/list"})
    public ResponseEntity<ApiResponse<List<AdminUserManagementRow>>> getUsersManagementTable() {
        try {
            List<AdminUserManagementRow> rows = adminUserService.getAdminUserManagementRows();
            return ResponseEntity.ok(ApiResponse.success(rows, "Users management data fetched successfully"));
        } catch (Exception e) {
            log.error("Failed to fetch users management data", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch users management data", 500));
        }
    }
}
