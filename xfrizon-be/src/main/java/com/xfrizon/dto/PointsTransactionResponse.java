package com.xfrizon.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PointsTransactionResponse {
    private Long id;
    private Integer points;
    private String type;
    private String sourceType;
    private String description;
    private LocalDateTime createdAt;
}
