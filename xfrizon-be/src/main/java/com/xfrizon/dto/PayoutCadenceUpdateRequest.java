package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayoutCadenceUpdateRequest {
    private String payoutCadence; // "WEEKLY" or "MONTHLY"
}
