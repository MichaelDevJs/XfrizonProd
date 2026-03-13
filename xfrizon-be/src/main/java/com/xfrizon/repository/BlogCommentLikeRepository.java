package com.xfrizon.repository;

import com.xfrizon.entity.BlogCommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogCommentLikeRepository extends JpaRepository<BlogCommentLike, Long> {
    Optional<BlogCommentLike> findByCommentIdAndUserId(Long commentId, Long userId);

    long countByCommentId(Long commentId);

    @Query("SELECT l.comment.id FROM BlogCommentLike l WHERE l.comment.id IN :commentIds AND l.user.id = :userId")
    List<Long> findLikedCommentIds(@Param("commentIds") List<Long> commentIds, @Param("userId") Long userId);

    @Query("SELECT l.comment.id, COUNT(l.id) FROM BlogCommentLike l WHERE l.comment.id IN :commentIds GROUP BY l.comment.id")
    List<Object[]> countLikesByCommentIds(@Param("commentIds") List<Long> commentIds);
}
