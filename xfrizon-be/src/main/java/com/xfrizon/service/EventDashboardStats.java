package com.xfrizon.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventDashboardStats {
    private int draftCount;
    private int publishedCount;
    private int liveCount;
    private int completedCount;
    private int totalCount;
}
