package com.xfrizon.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BlogCommentNotificationResponse {
    private Long id;
    private String type;
    private String message;
    private Long actorUserId;
    private String actorName;
    private Long blogId;
    private Long commentId;
    private Long parentCommentId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
