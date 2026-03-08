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
public class OrganizerProfileUpdateRequest {

    private String name;

    private String email;

    private String phone;

    private String location;

    private String address;

    private String description;

    private String logo;

    private String coverPhoto;

    private List<MediaItem> media;

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
