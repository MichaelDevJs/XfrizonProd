package com.xfrizon.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class CreatePartnerOfferRequest {
    @NotNull
    private Long partnerId;
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private Integer pointsCost;
    @NotNull
    private Integer discountPercent;
}
