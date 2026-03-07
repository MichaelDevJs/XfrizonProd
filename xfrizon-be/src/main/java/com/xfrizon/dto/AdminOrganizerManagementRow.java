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
public class AdminOrganizerManagementRow {
    private Long organizerId;
    private String name;
    private String phoneNumber;
    private String location;
    private String email;
    private Integer ticketsListed;
    private Integer ticketsSold;
    private BigDecimal payout;
    private String payoutMethod;
    private LocalDateTime dateJoined;
}
