package com.xfrizon.dto;

import lombok.Data;

import jakarta.validation.constraints.NotNull;

@Data
public class RedeemRequest {
    @NotNull
    private Long offerId;
}
