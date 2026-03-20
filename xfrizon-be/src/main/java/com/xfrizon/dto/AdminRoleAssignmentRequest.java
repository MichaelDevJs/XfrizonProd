package com.xfrizon.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminRoleAssignmentRequest {

    @NotBlank(message = "Role is required")
    private String role;
}
