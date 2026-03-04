package com.xfrizon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xfrizon.dto.BlogResponse;
import com.xfrizon.dto.CreateBlogRequest;
import com.xfrizon.dto.UpdateBlogRequest;
import com.xfrizon.entity.Blog;
import com.xfrizon.entity.User;
import com.xfrizon.repository.BlogRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@AllArgsConstructor
@Slf4j
public class BlogService {

    private final BlogRepository blogRepository;
    private final ObjectMapper objectMapper;

    /**
     * Convert Object to JSON String (handles JsonNode, Object, and String types)
     */
    private String objectToJsonString(Object obj) {
        if (obj == null) {
            return null;
        }
        if (obj instanceof String) {
            return (String) obj;
        }
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.warn("Failed to convert Object to String: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Get all active blogs with pagination
     */
    @Transactional(readOnly = true)
    public Page<BlogResponse> getAllBlogs(Pageable pageable) {
        log.info("Fetching all active blogs");
        return blogRepository.findAllActive(pageable).map(BlogResponse::from);
    }

    /**
     * Get blog by ID
     */
    @Transactional(readOnly = true)
    public BlogResponse getBlogById(Long id) {
        log.info("Fetching blog with ID: {}", id);
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found with ID: " + id));
        return BlogResponse.from(blog);
    }

    /**
     * Create new blog
     */
    @Transactional
    public BlogResponse createBlog(CreateBlogRequest request, User user) {
        log.info("Creating new blog: {}", request.getTitle());

        // Validate content has at least 10 characters
        if (request.getContent() == null || request.getContent().trim().length() < 10) {
            throw new IllegalArgumentException("Content must be at least 10 characters long");
        }

        Blog blog = Blog.builder()
                .title(request.getTitle())
                .author(request.getAuthor())
                .category(request.getCategory())
                .location(request.getLocation())
                .genre(request.getGenre())
            .coverImage(request.getCoverImage())
                .excerpt(request.getExcerpt())
                .content(request.getContent())
                .blocks(objectToJsonString(request.getBlocks()))
                .images(objectToJsonString(request.getImages()))
                .videos(objectToJsonString(request.getVideos()))
                .youtubeLinks(objectToJsonString(request.getYoutubeLinks()))
                .audioTracks(objectToJsonString(request.getAudioTracks()))
                .tags(objectToJsonString(request.getTags()))
                .titleStyle(objectToJsonString(request.getTitleStyle()))
                .status(request.getStatus() != null ? 
                        Blog.BlogStatus.valueOf(request.getStatus()) : Blog.BlogStatus.DRAFT)
                .createdBy(user)
                .build();

        Blog savedBlog = blogRepository.save(blog);
        log.info("Blog created successfully with ID: {}", savedBlog.getId());
        return BlogResponse.from(savedBlog);
    }

    /**
     * Update existing blog
     */
    @Transactional
    public BlogResponse updateBlog(Long id, UpdateBlogRequest request) {
        log.info("Updating blog with ID: {}", id);

        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found with ID: " + id));

        // Update only provided fields
        if (request.getTitle() != null) {
            blog.setTitle(request.getTitle());
        }
        if (request.getAuthor() != null) {
            blog.setAuthor(request.getAuthor());
        }
        if (request.getCategory() != null) {
            blog.setCategory(request.getCategory());
        }
        if (request.getLocation() != null) {
            blog.setLocation(request.getLocation());
        }
        if (request.getGenre() != null) {
            blog.setGenre(request.getGenre());
        }
        if (request.getCoverImage() != null) {
            blog.setCoverImage(request.getCoverImage());
        }
        if (request.getExcerpt() != null) {
            blog.setExcerpt(request.getExcerpt());
        }
        if (request.getContent() != null) {
            if (request.getContent().trim().length() < 10) {
                throw new IllegalArgumentException("Content must be at least 10 characters long");
            }
            blog.setContent(request.getContent());
        }
        if (request.getBlocks() != null) {
            blog.setBlocks(objectToJsonString(request.getBlocks()));
        }
        if (request.getImages() != null) {
            blog.setImages(objectToJsonString(request.getImages()));
        }
        if (request.getVideos() != null) {
            blog.setVideos(objectToJsonString(request.getVideos()));
        }
        if (request.getYoutubeLinks() != null) {
            blog.setYoutubeLinks(objectToJsonString(request.getYoutubeLinks()));
        }
        if (request.getAudioTracks() != null) {
            blog.setAudioTracks(objectToJsonString(request.getAudioTracks()));
        }
        if (request.getTitleStyle() != null) {
            blog.setTitleStyle(objectToJsonString(request.getTitleStyle()));
        }
        if (request.getTags() != null) {
            blog.setTags(objectToJsonString(request.getTags()));
        }

        Blog updatedBlog = blogRepository.save(blog);
        log.info("Blog updated successfully with ID: {}", updatedBlog.getId());
        return BlogResponse.from(updatedBlog);
    }

    /**
     * Delete blog (soft delete)
     */
    @Transactional
    public void deleteBlog(Long id) {
        log.info("Deleting blog with ID: {}", id);

        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found with ID: " + id));

        blog.setDeletedAt(LocalDateTime.now());
        blogRepository.save(blog);
        log.info("Blog deleted successfully with ID: {}", id);
    }

    /**
     * Publish blog (change status to Published)
     */
    @Transactional
    public BlogResponse publishBlog(Long id) {
        log.info("Publishing blog with ID: {}", id);

        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found with ID: " + id));

        try {
            blog.setStatus(Blog.BlogStatus.PUBLISHED);
            blog.setPublishedAt(LocalDateTime.now());
            
            Blog publishedBlog = blogRepository.save(blog);
            log.info("Blog published successfully with ID: {}", publishedBlog.getId());
            
            // Force initialization of lazy-loaded createdBy user before returning
            if (publishedBlog.getCreatedBy() != null) {
                publishedBlog.getCreatedBy().getFirstName();
            }
            
            return BlogResponse.from(publishedBlog);
        } catch (Exception e) {
            log.error("Error publishing blog with ID: {} - {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to publish blog: " + e.getMessage(), e);
        }
    }

    /**
     * Save blog as draft (update + set status to Draft)
     */
    @Transactional
    public BlogResponse saveDraft(Long id, UpdateBlogRequest request) {
        log.info("Saving blog as draft with ID: {}", id);

        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found with ID: " + id));

        // Apply updates
        if (request.getTitle() != null) {
            blog.setTitle(request.getTitle());
        }
        if (request.getAuthor() != null) {
            blog.setAuthor(request.getAuthor());
        }
        if (request.getCategory() != null) {
            blog.setCategory(request.getCategory());
        }
        if (request.getLocation() != null) {
            blog.setLocation(request.getLocation());
        }
        if (request.getGenre() != null) {
            blog.setGenre(request.getGenre());
        }
        if (request.getCoverImage() != null) {
            blog.setCoverImage(request.getCoverImage());
        }
        if (request.getExcerpt() != null) {
            blog.setExcerpt(request.getExcerpt());
        }
        if (request.getContent() != null) {
            blog.setContent(request.getContent());
        }
        if (request.getBlocks() != null) {
            blog.setBlocks(objectToJsonString(request.getBlocks()));
        }
        if (request.getImages() != null) {
            blog.setImages(objectToJsonString(request.getImages()));
        }
        if (request.getVideos() != null) {
            blog.setVideos(objectToJsonString(request.getVideos()));
        }
        if (request.getYoutubeLinks() != null) {
            blog.setYoutubeLinks(objectToJsonString(request.getYoutubeLinks()));
        }
        if (request.getAudioTracks() != null) {
            blog.setAudioTracks(objectToJsonString(request.getAudioTracks()));
        }
        if (request.getTitleStyle() != null) {
            blog.setTitleStyle(objectToJsonString(request.getTitleStyle()));
        }
        if (request.getTags() != null) {
            blog.setTags(objectToJsonString(request.getTags()));
        }

        blog.setStatus(Blog.BlogStatus.DRAFT);
        
        Blog draftBlog = blogRepository.save(blog);
        log.info("Blog saved as draft successfully with ID: {}", draftBlog.getId());
        return BlogResponse.from(draftBlog);
    }

    /**
     * Search blogs by title or content
     */
    @Transactional(readOnly = true)
    public Page<BlogResponse> searchBlogs(String search, Pageable pageable) {
        log.info("Searching blogs with query: {}", search);
        return blogRepository.searchByTitleOrContent(search, pageable).map(BlogResponse::from);
    }

    /**
     * Get blogs by status
     */
    @Transactional(readOnly = true)
    public Page<BlogResponse> getBlogsByStatus(String status, Pageable pageable) {
        log.info("Fetching blogs with status: {}", status);
        Blog.BlogStatus blogStatus = Blog.BlogStatus.valueOf(status.toUpperCase());
        return blogRepository.findByStatus(blogStatus, pageable).map(BlogResponse::from);
    }

    /**
     * Get blogs by category
     */
    @Transactional(readOnly = true)
    public Page<BlogResponse> getBlogsByCategory(String category, Pageable pageable) {
        log.info("Fetching blogs with category: {}", category);
        return blogRepository.findByCategory(category, pageable).map(BlogResponse::from);
    }

    /**
     * Get blogs by author
     */
    @Transactional(readOnly = true)
    public Page<BlogResponse> getBlogsByAuthor(String author, Pageable pageable) {
        log.info("Fetching blogs by author: {}", author);
        return blogRepository.findByAuthor(author, pageable).map(BlogResponse::from);
    }

    /**
     * Get published blogs
     */
    @Transactional(readOnly = true)
    public Page<BlogResponse> getPublishedBlogs(Pageable pageable) {
        log.info("Fetching published blogs");
        return blogRepository.findPublishedBlogs(pageable).map(BlogResponse::from);
    }

    /**
     * Get blogs created by user
     */
    @Transactional(readOnly = true)
    public Page<BlogResponse> getUserBlogs(Long userId, Pageable pageable) {
        log.info("Fetching blogs created by user: {}", userId);
        return blogRepository.findByCreatedBy(userId, pageable).map(BlogResponse::from);
    }
}
