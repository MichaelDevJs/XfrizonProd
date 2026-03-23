package com.xfrizon.controller;

import com.xfrizon.dto.AdminUserManagementRow;
import com.xfrizon.dto.AdminRoleAssignmentRequest;
import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.UserResponse;
import com.xfrizon.entity.User;
import com.xfrizon.service.AdminUserService;
import com.xfrizon.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    private final AuthService authService;

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

    @PutMapping("/{userId}/role")
    public ResponseEntity<ApiResponse<UserResponse>> assignRole(
            @PathVariable Long userId,
            @Valid @RequestBody AdminRoleAssignmentRequest request
    ) {
        try {
            User updatedUser = adminUserService.assignRole(userId, request.getRole());
            UserResponse userResponse = authService.getUserById(updatedUser.getId());
            return ResponseEntity.ok(ApiResponse.success(userResponse, "Role updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Failed to assign user role", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to assign user role", 500));
        }
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long userId) {
        try {
            adminUserService.deleteUser(userId);
            return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage(), 404));
        } catch (Exception e) {
            log.error("Failed to delete user {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete user. User may have related records that must be removed first.", 500));
        }
    }
}
