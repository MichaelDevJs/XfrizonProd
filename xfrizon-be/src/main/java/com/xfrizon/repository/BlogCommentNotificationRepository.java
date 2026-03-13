package com.xfrizon.repository;

import com.xfrizon.entity.BlogCommentNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogCommentNotificationRepository extends JpaRepository<BlogCommentNotification, Long> {
    List<BlogCommentNotification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    long countByRecipientIdAndIsReadFalse(Long recipientId);

    Optional<BlogCommentNotification> findByIdAndRecipientId(Long id, Long recipientId);

    @Modifying
    @Query("UPDATE BlogCommentNotification n SET n.isRead = true WHERE n.recipient.id = :recipientId AND n.isRead = false")
    int markAllAsRead(@Param("recipientId") Long recipientId);
}
