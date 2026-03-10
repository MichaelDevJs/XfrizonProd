package com.xfrizon.dto;

import com.xfrizon.entity.BlogComment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BlogCommentResponse {
    private Long id;
    private Long blogId;
    private Long userId;
    private String authorName;
    private String content;
    private LocalDateTime createdAt;

    public static BlogCommentResponse from(BlogComment comment) {
        String firstName = comment.getUser() != null ? comment.getUser().getFirstName() : "";
        String lastName = comment.getUser() != null ? comment.getUser().getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();

        return BlogCommentResponse.builder()
                .id(comment.getId())
                .blogId(comment.getBlog() != null ? comment.getBlog().getId() : null)
                .userId(comment.getUser() != null ? comment.getUser().getId() : null)
                .authorName(fullName.isEmpty() ? "User" : fullName)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
