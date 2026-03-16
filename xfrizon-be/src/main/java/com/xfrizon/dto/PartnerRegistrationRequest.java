package com.xfrizon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PartnerRegistrationRequest {
    @NotBlank
    private String name;

    private String description;
    private String brandLogo;

    @NotNull
    private String industry; // FOOD, HAIR_SALON, FASHION, ...

    @NotNull
    private String type; // ONLINE, IN_PERSON, BOTH

    private String website;
    private String location;
    private String address;
    private String contactEmail;
    private String contactPhone;
    private String loginPassword;
}
