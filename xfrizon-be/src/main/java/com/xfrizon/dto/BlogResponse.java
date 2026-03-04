package com.xfrizon.dto;

import com.xfrizon.entity.Blog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogResponse {

    private Long id;

    private String title;

    private String author;

    private String category;

    private String location;

    private String genre;

    private String coverImage;

    private String tags;

    private String excerpt;

    private String content;

    private String blocks;

    private String images;

    private String videos;

    private String youtubeLinks;

    private String audioTracks;

    private String titleStyle;

    private String status;

    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime publishedAt;

    public static BlogResponse from(Blog blog) {
        return BlogResponse.builder()
                .id(blog.getId())
                .title(blog.getTitle())
                .author(blog.getAuthor())
                .category(blog.getCategory())
                .location(blog.getLocation())
                .genre(blog.getGenre())
                .coverImage(blog.getCoverImage())
                .tags(blog.getTags())
                .excerpt(blog.getExcerpt())
                .content(blog.getContent())
                .blocks(blog.getBlocks())
                .images(blog.getImages())
                .videos(blog.getVideos())
                .youtubeLinks(blog.getYoutubeLinks())
                .audioTracks(blog.getAudioTracks())
                .titleStyle(blog.getTitleStyle())
                .status(blog.getStatus() != null ? blog.getStatus().toString() : "DRAFT")
                .createdBy(blog.getCreatedBy() != null ? 
                    blog.getCreatedBy().getFirstName() + " " + blog.getCreatedBy().getLastName() : 
                    "Unknown")
                .createdAt(blog.getCreatedAt())
                .updatedAt(blog.getUpdatedAt())
                .publishedAt(blog.getPublishedAt())
                .build();
    }
}
