package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.BlogCommentResponse;
import com.xfrizon.dto.BlogResponse;
import com.xfrizon.dto.CreateBlogCommentRequest;
import com.xfrizon.dto.CreateBlogRequest;
import com.xfrizon.dto.UpdateBlogRequest;
import com.xfrizon.entity.Blog;
import com.xfrizon.entity.BlogComment;
import com.xfrizon.entity.User;
import com.xfrizon.repository.BlogCommentRepository;
import com.xfrizon.repository.BlogRepository;
import com.xfrizon.repository.UserRepository;
import com.xfrizon.service.BlogService;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(
    origins = {"http://localhost:5173", "http://127.0.0.1:5173"},
    allowedHeaders = {"Authorization", "Content-Type"},
    allowCredentials = "false",
    methods = {
        RequestMethod.GET,
        RequestMethod.POST,
        RequestMethod.PUT,
        RequestMethod.PATCH,
        RequestMethod.DELETE,
        RequestMethod.OPTIONS
    }
)
@RestController
@RequestMapping("/api/v1/blogs")
@AllArgsConstructor
@Slf4j
public class BlogController {

    private final BlogService blogService;
    private final JwtTokenProvider jwtTokenProvider;
    private final BlogRepository blogRepository;
    private final UserRepository userRepository;
    private final BlogCommentRepository blogCommentRepository;

    /**
     * GET /api/v1/blogs - Get all blogs with filtering
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<BlogResponse>>> getAllBlogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String search) {
        try {
            log.info("Getting all blogs - page: {}, limit: {}", page, limit);
            Pageable pageable = PageRequest.of(page, limit);

            Page<BlogResponse> blogs;
            if (search != null && !search.isEmpty()) {
                blogs = blogService.searchBlogs(search, pageable);
            } else if (status != null && !status.isEmpty()) {
                blogs = blogService.getBlogsByStatus(status, pageable);
            } else if (category != null && !category.isEmpty()) {
                blogs = blogService.getBlogsByCategory(category, pageable);
            } else if (author != null && !author.isEmpty()) {
                blogs = blogService.getBlogsByAuthor(author, pageable);
            } else {
                blogs = blogService.getAllBlogs(pageable);
            }

            return ResponseEntity.ok(ApiResponse.success(blogs, "Blogs retrieved successfully"));
        } catch (Exception e) {
            log.error("Error fetching blogs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch blogs: " + e.getMessage(), 500));
        }
    }

    /**
     * GET /api/v1/blogs/:id - Get single blog
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BlogResponse>> getBlogById(@PathVariable Long id) {
        try {
            log.info("Getting blog with ID: {}", id);
            BlogResponse blog = blogService.getBlogById(id);
            return ResponseEntity.ok(ApiResponse.success(blog, "Blog retrieved successfully"));
        } catch (RuntimeException e) {
            log.error("Blog not found with ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Blog not found", 404));
        } catch (Exception e) {
            log.error("Error fetching blog", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch blog: " + e.getMessage(), 500));
        }
    }

    /**
     * POST /api/v1/blogs - Create new blog
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BlogResponse>> createBlog(
            @Valid @RequestBody CreateBlogRequest request,
            HttpServletRequest httpRequest) {
        try {
            log.info("Creating new blog: {}", request.getTitle());

            // Get user from token (simplified version)
            User user = new User();
            user.setId(1L); // This should be extracted from JWT token
            user.setFirstName("Admin");
            user.setLastName("User");

            BlogResponse blog = blogService.createBlog(request, user);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(blog, "Blog created successfully"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid blog data: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error creating blog", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create blog: " + e.getMessage(), 500));
        }
    }

    /**
     * PUT /api/v1/blogs/:id - Update blog
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BlogResponse>> updateBlog(
            @PathVariable Long id,
            @RequestBody UpdateBlogRequest request) {
        try {
            log.info("Updating blog with ID: {}", id);
            BlogResponse blog = blogService.updateBlog(id, request);
            return ResponseEntity.ok(ApiResponse.success(blog, "Blog updated successfully"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid blog data: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (RuntimeException e) {
            log.error("Blog not found with ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Blog not found", 404));
        } catch (Exception e) {
            log.error("Error updating blog", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update blog: " + e.getMessage(), 500));
        }
    }

    /**
     * DELETE /api/v1/blogs/:id - Delete blog (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBlog(@PathVariable Long id) {
        try {
            log.info("Deleting blog with ID: {}", id);
            blogService.deleteBlog(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Blog deleted successfully"));
        } catch (RuntimeException e) {
            log.error("Blog not found with ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Blog not found", 404));
        } catch (Exception e) {
            log.error("Error deleting blog", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete blog: " + e.getMessage(), 500));
        }
    }

    /**
     * PATCH /api/v1/blogs/:id/publish - Publish blog
     */
    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<BlogResponse>> publishBlog(@PathVariable Long id) {
        try {
            log.info("Publishing blog with ID: {}", id);
            BlogResponse blog = blogService.publishBlog(id);
            return ResponseEntity.ok(ApiResponse.success(blog, "Blog published successfully"));
        } catch (RuntimeException e) {
            log.error("Blog not found with ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Blog not found", 404));
        } catch (Exception e) {
            log.error("Error publishing blog", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to publish blog: " + e.getMessage(), 500));
        }
    }

    /**
     * PATCH /api/v1/blogs/:id/draft - Save blog as draft
     */
    @PatchMapping("/{id}/draft")
    public ResponseEntity<ApiResponse<BlogResponse>> saveDraft(
            @PathVariable Long id,
            @RequestBody UpdateBlogRequest request) {
        try {
            log.info("Saving blog as draft with ID: {}", id);
            BlogResponse blog = blogService.saveDraft(id, request);
            return ResponseEntity.ok(ApiResponse.success(blog, "Blog saved as draft successfully"));
        } catch (RuntimeException e) {
            log.error("Blog not found with ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Blog not found", 404));
        } catch (Exception e) {
            log.error("Error saving draft", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to save draft: " + e.getMessage(), 500));
        }
    }

    /**
     * GET /api/v1/blogs/published - Get published blogs
     */
    @GetMapping("/published")
    public ResponseEntity<ApiResponse<Page<BlogResponse>>> getPublishedBlogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            log.info("Getting published blogs - page: {}, limit: {}", page, limit);
            Pageable pageable = PageRequest.of(page, limit);
            Page<BlogResponse> blogs = blogService.getPublishedBlogs(pageable);
            return ResponseEntity.ok(ApiResponse.success(blogs, "Published blogs retrieved successfully"));
        } catch (Exception e) {
            log.error("Error fetching published blogs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch published blogs: " + e.getMessage(), 500));
        }
    }

    /**
     * GET /api/v1/blogs/user/:userId - Get user's blogs
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<BlogResponse>>> getUserBlogs(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            log.info("Getting blogs for user: {} - page: {}, limit: {}", userId, page, limit);
            Pageable pageable = PageRequest.of(page, limit);
            Page<BlogResponse> blogs = blogService.getUserBlogs(userId, pageable);
            return ResponseEntity.ok(ApiResponse.success(blogs, "User blogs retrieved successfully"));
        } catch (Exception e) {
            log.error("Error fetching user blogs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch user blogs: " + e.getMessage(), 500));
        }
    }

    /**
     * GET /api/v1/blogs/:id/comments - Get comments for a blog article
     */
    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<BlogCommentResponse>>> getBlogComments(@PathVariable Long id) {
        try {
            if (!blogRepository.existsAndNotDeleted(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Blog not found", 404));
            }

            List<BlogCommentResponse> comments = blogCommentRepository.findByBlogIdOrderByCreatedAtDesc(id)
                    .stream()
                    .map(BlogCommentResponse::from)
                    .toList();

            return ResponseEntity.ok(ApiResponse.success(comments, "Comments retrieved successfully"));
        } catch (Exception e) {
            log.error("Error fetching comments for blog {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch comments", 500));
        }
    }

    /**
     * POST /api/v1/blogs/:id/comments - Add a comment (requires valid JWT)
     */
    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<BlogCommentResponse>> createBlogComment(
            @PathVariable Long id,
            @Valid @RequestBody CreateBlogCommentRequest request,
            HttpServletRequest httpRequest) {
        try {
            String token = getTokenFromRequest(httpRequest);
            if (token == null || !jwtTokenProvider.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Authentication required", 401));
            }

            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            User user = userRepository.findByIdAndIsActiveTrue(userId)
                    .orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid user", 401));
            }

            Blog blog = blogRepository.findById(id)
                    .orElse(null);
            if (blog == null || blog.getDeletedAt() != null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Blog not found", 404));
            }

            String content = request.getContent() != null ? request.getContent().trim() : "";
            if (content.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Comment content is required", 400));
            }

            BlogComment saved = blogCommentRepository.save(BlogComment.builder()
                    .blog(blog)
                    .user(user)
                    .content(content)
                    .build());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(BlogCommentResponse.from(saved), "Comment added successfully"));
        } catch (Exception e) {
            log.error("Error creating comment for blog {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create comment", 500));
        }
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
