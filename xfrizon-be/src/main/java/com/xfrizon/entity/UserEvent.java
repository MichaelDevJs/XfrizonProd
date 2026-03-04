package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_events", indexes = {
    @Index(name = "idx_user_event_user_id", columnList = "user_id"),
    @Index(name = "idx_user_event_event_id", columnList = "event_id"),
    @Index(name = "idx_user_event_created_at", columnList = "created_at"),
    @Index(name = "idx_user_event_unique", columnList = "user_id,event_id", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
public class UserEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
