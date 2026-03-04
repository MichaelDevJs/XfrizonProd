package com.xfrizon.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBlogRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    private String title;

    @NotBlank(message = "Author is required")
    @Size(min = 2, max = 255, message = "Author must be between 2 and 255 characters")
    private String author;

    @Size(max = 100, message = "Category must be maximum 100 characters")
    private String category;

    private String location;

    private String genre;

    private String coverImage;

    private Object tags;

    @Size(max = 500, message = "Excerpt must be maximum 500 characters")
    private String excerpt;

    @NotBlank(message = "Content is required")
    private String content;

    // Accept arrays/objects and convert to JSON string
    private Object blocks;
    private Object images;
    private Object videos;
    private Object youtubeLinks;
    private Object audioTracks;
    private Object titleStyle;

    private String status;
    
    /**
     * Convert Object to JSON string using ObjectMapper
     */
    public String objectToJsonString(Object obj) {
        if (obj == null) {
            return null;
        }
        if (obj instanceof String) {
            return (String) obj;
        }
        try {
            return new ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }
}
