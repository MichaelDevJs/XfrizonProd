package com.xfrizon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateBlogCommentRequest {

    @NotBlank(message = "Comment content is required")
    @Size(max = 1000, message = "Comment must be 1000 characters or less")
    private String content;

    private Long parentCommentId;
}
