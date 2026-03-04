package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;

    private String firstName;

    private String lastName;

    private String email;

    private String phoneNumber;

    private String location;

    private String profilePicture;

    private String logo;

    private String role;

    private Boolean isActive;

    private Boolean isEmailVerified;

    private String bio;

    private String address;

    private String coverPhoto;

    private String name;

    private List<String> favoriteArtists;

    private List<MediaItem> media;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MediaItem {
        private String url;
        private String caption;
    }
}
