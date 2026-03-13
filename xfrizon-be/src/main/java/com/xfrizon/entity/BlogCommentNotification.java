package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "blog_comment_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogCommentNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipient;

    @Column(name = "actor_user_id", nullable = false)
    private Long actorUserId;

    @Column(name = "actor_name", nullable = false, length = 150)
    private String actorName;

    @Column(name = "blog_id", nullable = false)
    private Long blogId;

    @Column(name = "comment_id", nullable = false)
    private Long commentId;

    @Column(name = "parent_comment_id")
    private Long parentCommentId;

    @Column(nullable = false, length = 40)
    private String type;

    @Column(nullable = false, length = 255)
    private String message;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isRead == null) {
            isRead = false;
        }
    }
}
