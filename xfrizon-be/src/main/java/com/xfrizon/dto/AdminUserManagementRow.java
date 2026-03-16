package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserManagementRow {

    private Long userId;
    private String name;
    private String email;
    private String role;
    private String roles;
    private String location;
    private Integer ticketsBought;
    private BigDecimal amountSpent;
    private String phoneNumber;
    private String address;
    private String website;
    private String instagram;
    private String twitter;
    private String bio;
    private LocalDateTime dateJoined;
}
