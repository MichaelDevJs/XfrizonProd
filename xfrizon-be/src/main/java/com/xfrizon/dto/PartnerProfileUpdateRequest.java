package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerProfileUpdateRequest {

    private String name;
    private String description;
    private String logoUrl;
    private String profilePhotoUrl;
    private String coverPhoto;
    private String category;
    private String type;
    private String location;
    private String address;
    private String website;
    private String instagram;
    private String twitter;
    private String contactEmail;
    private String contactPhone;
    private String aboutPrimaryTitle;
    private String aboutPrimaryBody;
    private String aboutSecondaryTitle;
    private String aboutSecondaryBody;
    private String headlineTitle;
    private String headlineBody;
    private String headlineLinkLabel;
    private String headlineLinkUrl;
    private List<MediaItem> coverMedia;
    private List<MediaItem> gallery;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MediaItem {
        private String url;
        private String caption;
        private String type;
    }
}