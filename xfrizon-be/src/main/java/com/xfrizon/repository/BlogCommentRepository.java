package com.xfrizon.repository;

import com.xfrizon.entity.BlogComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogCommentRepository extends JpaRepository<BlogComment, Long> {
    List<BlogComment> findByBlogIdOrderByCreatedAtDesc(Long blogId);

    @Query("SELECT c FROM BlogComment c JOIN FETCH c.user WHERE c.blog.id = :blogId ORDER BY c.createdAt ASC")
    List<BlogComment> findByBlogIdWithUserOrderByCreatedAtAsc(@Param("blogId") Long blogId);

    Optional<BlogComment> findByIdAndBlogId(Long id, Long blogId);
}
