package com.xfrizon.repository;

import com.xfrizon.entity.Blog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {

    interface BlogSitemapEntry {
        Long getId();
        LocalDateTime getLastModified();
    }

    // Find all blogs that are not deleted
    @Query("SELECT b FROM Blog b WHERE b.deletedAt IS NULL ORDER BY b.createdAt DESC")
    Page<Blog> findAllActive(Pageable pageable);

    // Find blogs by status
    @Query("SELECT b FROM Blog b WHERE b.status = :status AND b.deletedAt IS NULL ORDER BY b.createdAt DESC")
    Page<Blog> findByStatus(@Param("status") Blog.BlogStatus status, Pageable pageable);

    // Find blogs by category
    @Query("SELECT b FROM Blog b WHERE b.category = :category AND b.deletedAt IS NULL ORDER BY b.createdAt DESC")
    Page<Blog> findByCategory(@Param("category") String category, Pageable pageable);

    // Find blogs by author
    @Query("SELECT b FROM Blog b WHERE b.author = :author AND b.deletedAt IS NULL ORDER BY b.createdAt DESC")
    Page<Blog> findByAuthor(@Param("author") String author, Pageable pageable);

    // Search blogs by title or content
    @Query("SELECT b FROM Blog b WHERE (LOWER(b.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(b.content) LIKE LOWER(CONCAT('%', :search, '%'))) AND b.deletedAt IS NULL ORDER BY b.createdAt DESC")
    Page<Blog> searchByTitleOrContent(@Param("search") String search, Pageable pageable);

    // Find published blogs
    @Query("SELECT b FROM Blog b WHERE b.status = com.xfrizon.entity.Blog$BlogStatus.PUBLISHED AND b.deletedAt IS NULL ORDER BY b.publishedAt DESC")
    Page<Blog> findPublishedBlogs(Pageable pageable);

    // Find blog by ID (not deleted)
    @Query("SELECT b FROM Blog b WHERE b.id = :id AND b.deletedAt IS NULL")
    Optional<Blog> findById(@Param("id") Long id);

    // Find blogs by created user ID
    @Query("SELECT b FROM Blog b WHERE b.createdBy.id = :userId AND b.deletedAt IS NULL ORDER BY b.createdAt DESC")
    Page<Blog> findByCreatedBy(@Param("userId") Long userId, Pageable pageable);

    // Check if blog exists and is not deleted
    @Query("SELECT COUNT(b) > 0 FROM Blog b WHERE b.id = :id AND b.deletedAt IS NULL")
    boolean existsAndNotDeleted(@Param("id") Long id);

    @Query("SELECT COUNT(b) FROM Blog b WHERE b.deletedAt IS NULL")
    long countActiveBlogs();

        @Query("""
                SELECT b.id AS id,
                             COALESCE(b.updatedAt, b.publishedAt, b.createdAt) AS lastModified
                FROM Blog b
                WHERE b.status = com.xfrizon.entity.Blog$BlogStatus.PUBLISHED
                    AND b.deletedAt IS NULL
                ORDER BY COALESCE(b.updatedAt, b.publishedAt, b.createdAt) DESC
                """)
        List<BlogSitemapEntry> findPublishedBlogSitemapEntries();
}
