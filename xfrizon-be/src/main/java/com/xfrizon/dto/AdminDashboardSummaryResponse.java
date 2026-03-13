package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardSummaryResponse {

    private Long totalBlogs;
    private Long totalUsers;
    private Long totalOrganizers;
    private Long verifiedOrganizers;
    private Long pendingVerification;
    private Long unreadMessages;
}