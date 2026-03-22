package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;

    private String type = "Bearer";

    private Long userId;

    private String email;

    private String firstName;

    private String lastName;

    private String name;

    private String role;

    private String roles;

    private String message;

    private Boolean success;

    private String logo;

    private String profilePicture;

    private String phoneNumber;

    private String location;

    private String address;

    private String bio;

    private String coverPhoto;

    private Boolean emailVerificationPending;
}
