package com.xfrizon.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
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
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/uploads")
@Slf4j
@CrossOrigin(origins = "*")
public class UploadController {

    @Value("${upload.directory:uploads/}")
    private String uploadDir;

    @Value("${cloudinary.enabled:false}")
    private boolean cloudinaryEnabled;

    @Value("${cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @Value("${cloudinary.api-key:}")
    private String cloudinaryApiKey;

    @Value("${cloudinary.api-secret:}")
    private String cloudinaryApiSecret;

    @Value("${cloudinary.folder:xfrizon}")
    private String cloudinaryFolder;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        try {
            if (cloudinaryEnabled
                    && !cloudinaryCloudName.isBlank()
                    && !cloudinaryApiKey.isBlank()
                    && !cloudinaryApiSecret.isBlank()) {
                this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                        "cloud_name", cloudinaryCloudName,
                        "api_key", cloudinaryApiKey,
                        "api_secret", cloudinaryApiSecret,
                        "secure", true
                ));
                log.info("Cloudinary uploads enabled for cloud '{}'", cloudinaryCloudName);
                return;
            }

            if (cloudinaryEnabled) {
                log.warn("Cloudinary enabled but credentials are incomplete. Falling back to local disk uploads.");
            }

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

    private boolean isCloudinaryActive() {
        return cloudinary != null;
    }

    private ResponseEntity<?> uploadToCloudinary(MultipartFile file, String prefix) {
        Path tempFile = null;
        try {
            String originalFilename = file.getOriginalFilename();
            String publicId = prefix + "_" + UUID.randomUUID();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            }

            tempFile = Files.createTempFile("xfrizon-cloudinary-", extension);
            Files.copy(file.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);

            Map<?, ?> result = cloudinary.uploader().upload(
                    tempFile.toFile(),
                    ObjectUtils.asMap(
                            "resource_type", "auto",
                            "folder", cloudinaryFolder,
                            "public_id", publicId,
                            "use_filename", true,
                            "unique_filename", true,
                            "filename_override", originalFilename
                    )
            );

            String secureUrl = String.valueOf(result.get("secure_url"));
            Object publicIdValue = result.get("public_id");
            String finalName = String.valueOf(publicIdValue != null ? publicIdValue : publicId);

            log.info("File uploaded to Cloudinary successfully: {}", finalName);
            return ResponseEntity.ok().body(new UploadResponse(
                    secureUrl,
                    finalName,
                    file.getSize()
            ));
        } catch (Exception e) {
            log.error("Cloudinary upload failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload file to Cloudinary: " + e.getMessage());
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException deleteError) {
                    log.warn("Failed to delete temporary upload file: {}", tempFile, deleteError);
                }
            }
        }
    }

    private ResponseEntity<?> uploadToLocalDisk(MultipartFile file, String prefix) {
        try {
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                uploadDirectory.mkdirs();
                log.info("Created upload directory: {}", uploadDirectory.getAbsolutePath());
            }

            String originalFilename = file.getOriginalFilename();
            String filename = prefix + "_" + UUID.randomUUID() + "_" + originalFilename;
            Path filePath = Paths.get(uploadDirectory.getAbsolutePath(), filename);
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

    private ResponseEntity<?> uploadWithStorage(MultipartFile file, String prefix) {
        if (isCloudinaryActive()) {
            return uploadToCloudinary(file, prefix);
        }
        return uploadToLocalDisk(file, prefix);
    }

    /**
     * Upload a file (e.g., event flyer)
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }
        return uploadWithStorage(file, "file");
    }

    /**
     * Upload organizer logo/profile picture
     */
    @PostMapping("/organizer-logo")
    public ResponseEntity<?> uploadOrganizerLogo(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body("Please upload a valid image file");
        }

        return uploadWithStorage(file, "logo");
    }

    /**
     * Upload user profile photo
     */
    @PostMapping("/profile-photo")
    public ResponseEntity<?> uploadProfilePhoto(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body("Please upload a valid image file");
        }

        return uploadWithStorage(file, "profile");
    }

    /**
     * Upload cover photo
     */
    @PostMapping("/cover-photo")
    public ResponseEntity<?> uploadCoverPhoto(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body("Please upload a valid image file");
        }

        return uploadWithStorage(file, "cover");
    }

    /**
     * Upload media files
     */
    @PostMapping("/media")
    public ResponseEntity<?> uploadMedia(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
            return ResponseEntity.badRequest().body("Please upload a valid image or video file");
        }

        return uploadWithStorage(file, "media");
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
