package com.xfrizon.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePayoutCadenceRequest {

    @NotBlank(message = "Payout cadence is required (WEEKLY or MONTHLY)")
    private String cadence;
}
