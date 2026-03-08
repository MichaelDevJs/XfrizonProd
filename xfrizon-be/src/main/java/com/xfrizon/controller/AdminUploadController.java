package com.xfrizon.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/upload")
@Slf4j
@CrossOrigin(origins = "*")
public class AdminUploadController {

    @Value("${upload.directory:uploads/}")
    private String uploadDir;

    /**
     * Upload hero slide (video or image for homepage carousel)
     * 
     * @param file The video or image file to upload
     * @param type Optional type: "video" or "image" (default: detected from content type)
     * @return Upload response with file URL
     */
    @PostMapping("/hero-slide")
    public ResponseEntity<?> uploadHeroSlide(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", required = false) String type) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("File is empty"));
            }

            String contentType = file.getContentType();
            if (contentType == null) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Unable to determine file type"));
            }

            // Determine if it's a video or image
            boolean isVideo = contentType.startsWith("video/");
            boolean isImage = contentType.startsWith("image/");

            if (!isVideo && !isImage) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Please upload a valid video or image file. Received: " + contentType));
            }

            // Log file details
            log.info("Uploading hero slide - File: {}, Type: {}, ContentType: {}, Size: {} bytes",
                    file.getOriginalFilename(), isVideo ? "video" : "image", contentType, file.getSize());

            // Create upload directory if it doesn't exist
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                boolean created = uploadDirectory.mkdirs();
                if (created) {
                    log.info("Created upload directory: {}", uploadDirectory.getAbsolutePath());
                } else {
                    log.warn("Failed to create upload directory: {}", uploadDirectory.getAbsolutePath());
                }
            }

            // Generate unique filename with 'hero' prefix
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String filename = "hero_" + UUID.randomUUID() + (extension != null ? "." + extension : "");
            Path filePath = Paths.get(uploadDirectory.getAbsolutePath(), filename);

            // Save file
            Files.copy(file.getInputStream(), filePath);

            // Return file URL (accessible via /uploads/{filename})
            String fileUrl = "/uploads/" + filename;
            log.info("Hero slide uploaded successfully: {} -> {}", originalFilename, fileUrl);

            return ResponseEntity.ok(new UploadResponse(
                    fileUrl,
                    filename,
                    file.getSize(),
                    isVideo ? "video" : "image"
            ));

        } catch (IOException e) {
            log.error("Error uploading hero slide", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to upload file: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error uploading hero slide", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Unexpected error: " + e.getMessage()));
        }
    }

    /**
     * Extract file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return null;
        }
        int lastDot = filename.lastIndexOf('.');
        return filename.substring(lastDot + 1).toLowerCase();
    }

    /**
     * DTO for successful upload response
     */
    public static class UploadResponse {
        public String url;
        public String filename;
        public long size;
        public String type;

        public UploadResponse(String url, String filename, long size, String type) {
            this.url = url;
            this.filename = filename;
            this.size = size;
            this.type = type;
        }
    }

    /**
     * DTO for error response
     */
    public static class ErrorResponse {
        public String error;
        public long timestamp;

        public ErrorResponse(String error) {
            this.error = error;
            this.timestamp = System.currentTimeMillis();
        }
    }
}
