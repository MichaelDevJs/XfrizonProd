package com.xfrizon.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PartnerOfferResponse {
    private Long id;
    private Long partnerId;
    private String partnerName;
    private String partnerCategory;
    private String title;
    private String description;
    private Integer pointsCost;
    private Integer discountPercent;
}
