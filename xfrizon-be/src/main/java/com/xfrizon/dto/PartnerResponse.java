package com.xfrizon.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PartnerResponse {
    private Long id;
    private String name;
    private String description;
    private String logoUrl;
    private String industry;
    private String category;
    private String type;
    private String website;
    private String location;
    private String address;
    private String contactEmail;
    private String contactPhone;
    private Boolean isActive;
    private List<PartnerOfferResponse> offers;
}
