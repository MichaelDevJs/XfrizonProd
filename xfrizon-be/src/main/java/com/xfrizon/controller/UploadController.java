package com.xfrizon.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/uploads")
@Slf4j
@CrossOrigin(origins = "*")
public class UploadController {

    @Value("${upload.directory:uploads/}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                boolean created = uploadDirectory.mkdirs();
                if (created) {
                    log.info("Upload directory created successfully: {}", uploadDirectory.getAbsolutePath());
                } else {
                    log.warn("Failed to create upload directory: {}", uploadDirectory.getAbsolutePath());
                }
            } else {
                log.info("Upload directory already exists: {}", uploadDirectory.getAbsolutePath());
            }
            log.info("Uploads configured at: {}", new File(uploadDir).getAbsolutePath());
        } catch (Exception e) {
            log.error("Error initializing upload directory", e);
        }
    }

    /**
     * Upload a file (e.g., event flyer)
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            // Create upload directory if it doesn't exist
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                uploadDirectory.mkdirs();
                log.info("Created upload directory: {}", uploadDirectory.getAbsolutePath());
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String filename = UUID.randomUUID() + "_" + originalFilename;
            Path filePath = Paths.get(uploadDirectory.getAbsolutePath(), filename);

            // Save file
            Files.copy(file.getInputStream(), filePath);

            log.info("File uploaded successfully: {} at {}", filename, filePath.toAbsolutePath());

                return ResponseEntity.ok().body(new UploadResponse(
                    "/uploads/" + filename,
                    filename,
                    file.getSize()
                ));
        } catch (IOException e) {
            log.error("Error uploading file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload file: " + e.getMessage());
        }
    }

    /**
     * Upload organizer logo/profile picture
     */
    @PostMapping("/organizer-logo")
    public ResponseEntity<?> uploadOrganizerLogo(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            // Validate file is an image
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("Please upload a valid image file");
            }

            // Create upload directory if it doesn't exist
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                uploadDirectory.mkdirs();
                log.info("Created upload directory: {}", uploadDirectory.getAbsolutePath());
            }

            // Generate unique filename with 'logo' prefix
            String originalFilename = file.getOriginalFilename();
            String filename = "logo_" + UUID.randomUUID() + "_" + originalFilename;
            Path filePath = Paths.get(uploadDirectory.getAbsolutePath(), filename);

            // Save file
            Files.copy(file.getInputStream(), filePath);

            log.info("Organizer logo uploaded successfully: {} at {}", filename, filePath.toAbsolutePath());

                return ResponseEntity.ok().body(new UploadResponse(
                    "/uploads/" + filename,
                    filename,
                    file.getSize()
                ));
        } catch (IOException e) {
            log.error("Error uploading organizer logo", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload logo: " + e.getMessage());
        }
    }

    /**
     * Upload user profile photo
     */
    @PostMapping("/profile-photo")
    public ResponseEntity<?> uploadProfilePhoto(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            // Validate file is an image
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("Please upload a valid image file");
            }

            // Create upload directory if it doesn't exist
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                uploadDirectory.mkdirs();
                log.info("Created upload directory: {}", uploadDirectory.getAbsolutePath());
            }

            // Generate unique filename with 'profile' prefix
            String originalFilename = file.getOriginalFilename();
            String filename = "profile_" + UUID.randomUUID() + "_" + originalFilename;
            Path filePath = Paths.get(uploadDirectory.getAbsolutePath(), filename);

            // Save file
            Files.copy(file.getInputStream(), filePath);

            log.info("User profile photo uploaded successfully: {} at {}", filename, filePath.toAbsolutePath());

                return ResponseEntity.ok().body(new UploadResponse(
                    "/uploads/" + filename,
                    filename,
                    file.getSize()
                ));
        } catch (IOException e) {
            log.error("Error uploading profile photo", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload profile photo: " + e.getMessage());
        }
    }

    /**
     * Upload cover photo
     */
    @PostMapping("/cover-photo")
    public ResponseEntity<?> uploadCoverPhoto(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            // Validate file is an image
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("Please upload a valid image file");
            }

            // Create upload directory if it doesn't exist
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                uploadDirectory.mkdirs();
                log.info("Created upload directory: {}", uploadDirectory.getAbsolutePath());
            }

            // Generate unique filename with 'cover' prefix
            String originalFilename = file.getOriginalFilename();
            String filename = "cover_" + UUID.randomUUID() + "_" + originalFilename;
            Path filePath = Paths.get(uploadDirectory.getAbsolutePath(), filename);

            // Save file
            Files.copy(file.getInputStream(), filePath);

            log.info("Cover photo uploaded successfully: {} at {}", filename, filePath.toAbsolutePath());

                return ResponseEntity.ok().body(new UploadResponse(
                    "/uploads/" + filename,
                    filename,
                    file.getSize()
                ));
        } catch (IOException e) {
            log.error("Error uploading cover photo", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload cover photo: " + e.getMessage());
        }
    }

    /**
     * Upload media files
     */
    @PostMapping("/media")
    public ResponseEntity<?> uploadMedia(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            // Validate file is an image
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("Please upload a valid image file");
            }

            // Create upload directory if it doesn't exist
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                uploadDirectory.mkdirs();
                log.info("Created upload directory: {}", uploadDirectory.getAbsolutePath());
            }

            // Generate unique filename with 'media' prefix
            String originalFilename = file.getOriginalFilename();
            String filename = "media_" + UUID.randomUUID() + "_" + originalFilename;
            Path filePath = Paths.get(uploadDirectory.getAbsolutePath(), filename);

            // Save file
            Files.copy(file.getInputStream(), filePath);

            log.info("Media file uploaded successfully: {} at {}", filename, filePath.toAbsolutePath());

                return ResponseEntity.ok().body(new UploadResponse(
                    "/uploads/" + filename,
                    filename,
                    file.getSize()
                ));
        } catch (IOException e) {
            log.error("Error uploading media file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload media file: " + e.getMessage());
        }
    }

    /**
     * Download/retrieve a file by filename
     */
    @GetMapping("/{filename}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            // Security: prevent directory traversal
            if (filename == null || filename.isEmpty() || filename.contains("..")) {
                log.warn("Invalid filename requested: {}", filename);
                return ResponseEntity.badRequest().build();
            }

            File uploadDirectory = new File(uploadDir);
            
            // Ensure uploads directory exists
            if (!uploadDirectory.exists()) {
                log.error("Uploads directory does not exist: {}", uploadDirectory.getAbsolutePath());
                return ResponseEntity.notFound().build();
            }

            Path uploadDirPath = uploadDirectory.getAbsoluteFile().toPath();
            Path filePath = uploadDirPath.resolve(filename).normalize();
            File file = filePath.toFile();

            // Verify file is within upload directory and exists
            if (!filePath.startsWith(uploadDirPath)) {
                log.warn("Path traversal attempt detected: {} -> {}", filename, filePath.toAbsolutePath());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            if (!file.exists() || !file.isFile()) {
                log.warn("File not found or is not a regular file: {}", filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.warn("Resource not readable: {}", filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            log.info("Serving file: {} from {}", filename, filePath.toAbsolutePath());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            log.error("Malformed URL for file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IOException e) {
            log.error("IO error retrieving file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("Unexpected error retrieving file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * DTO for upload response
     */
    public static class UploadResponse {
        public String url;
        public String filename;
        public long size;

        public UploadResponse(String url, String filename, long size) {
            this.url = url;
            this.filename = filename;
            this.size = size;
        }
    }
}
