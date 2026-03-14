package com.xfrizon.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class CreatePartnerRequest {
    @NotBlank
    private String name;
    private String description;
    private String logoUrl;
    @NotNull
    private String category;  // matches Partner.PartnerCategory enum
    @NotNull
    private String type;      // matches Partner.PartnerType enum
    private String website;
    private String location;
    private String address;
    private String contactEmail;
    private String contactPhone;
}
