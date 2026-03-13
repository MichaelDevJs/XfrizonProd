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
    private Long parentCommentId;
    private String authorName;
    private String content;
    private Long likeCount;
    private Boolean likedByCurrentUser;
    private LocalDateTime createdAt;

    public static BlogCommentResponse from(BlogComment comment) {
        String firstName = comment.getUser() != null ? comment.getUser().getFirstName() : "";
        String lastName = comment.getUser() != null ? comment.getUser().getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();

        return BlogCommentResponse.builder()
                .id(comment.getId())
                .blogId(comment.getBlog() != null ? comment.getBlog().getId() : null)
                .userId(comment.getUser() != null ? comment.getUser().getId() : null)
            .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .authorName(fullName.isEmpty() ? "User" : fullName)
                .content(comment.getContent())
            .likeCount(0L)
            .likedByCurrentUser(false)
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
