package com.xfrizon.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventRsvpRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 80, message = "First name cannot exceed 80 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 80, message = "Last name cannot exceed 80 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    @Size(max = 180, message = "Email cannot exceed 180 characters")
    private String email;

    @Size(max = 40, message = "Phone cannot exceed 40 characters")
    private String phone;

    @Size(max = 1000, message = "Note cannot exceed 1000 characters")
    private String note;
}
