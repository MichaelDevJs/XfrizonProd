package com.xfrizon.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/upload")
@Slf4j
@CrossOrigin(origins = "*")
public class AdminUploadController {

    @Value("${upload.directory:uploads/}")
    private String uploadDir;

    @Value("${cloudinary.enabled:false}")
    private boolean cloudinaryEnabled;

    @Value("${cloudinary.required:false}")
    private boolean cloudinaryRequired;

    @Value("${cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @Value("${cloudinary.api-key:}")
    private String cloudinaryApiKey;

    @Value("${cloudinary.api-secret:}")
    private String cloudinaryApiSecret;

    @Value("${cloudinary.url:}")
    private String cloudinaryUrl;

    @Value("${cloudinary.folder:xfrizon}")
    private String cloudinaryFolder;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        if (configureCloudinaryIfAvailable()) {
            return;
        }

        if (cloudinaryRequired) {
            throw new IllegalStateException(
                    "Cloudinary is required for admin uploads but not configured.");
        }
    }

    private boolean isCloudinaryActive() {
        return cloudinary != null;
    }

    private boolean configureCloudinaryIfAvailable() {
        boolean hasExplicitCredentials = !cloudinaryCloudName.isBlank()
                && !cloudinaryApiKey.isBlank()
                && !cloudinaryApiSecret.isBlank();
        boolean hasCloudinaryUrl = cloudinaryUrl != null && !cloudinaryUrl.isBlank();

        if (!cloudinaryEnabled && !hasExplicitCredentials && !hasCloudinaryUrl) {
            return false;
        }

        if (hasExplicitCredentials) {
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudinaryCloudName,
                    "api_key", cloudinaryApiKey,
                    "api_secret", cloudinaryApiSecret,
                    "secure", true
            ));
            log.info("Admin uploads using Cloudinary cloud '{}' via explicit credentials", cloudinaryCloudName);
            return true;
        }

        if (hasCloudinaryUrl) {
            try {
                Map<String, Object> parsedConfig = parseCloudinaryUrl(cloudinaryUrl);
                cloudinary = new Cloudinary(parsedConfig);
                log.info("Admin uploads using CLOUDINARY_URL for cloud '{}'", parsedConfig.get("cloud_name"));
                return true;
            } catch (Exception parseError) {
                log.warn("Invalid CLOUDINARY_URL format for admin uploads. Falling back to local disk.", parseError);
            }
        }

        if (cloudinaryEnabled) {
            log.warn("Cloudinary enabled but admin upload credentials are incomplete. Falling back to local disk.");
        }

        return false;
    }

    private Map<String, Object> parseCloudinaryUrl(String rawUrl) {
        URI uri = URI.create(rawUrl.trim());
        if (!"cloudinary".equalsIgnoreCase(uri.getScheme())) {
            throw new IllegalArgumentException("CLOUDINARY_URL must start with cloudinary://");
        }

        String userInfo = uri.getUserInfo();
        if (userInfo == null || !userInfo.contains(":")) {
            throw new IllegalArgumentException("CLOUDINARY_URL is missing api_key or api_secret");
        }

        String[] credentials = userInfo.split(":", 2);
        String apiKey = credentials[0];
        String apiSecret = credentials[1];
        String cloudName = uri.getHost();
        if ((cloudName == null || cloudName.isBlank()) && uri.getPath() != null) {
            cloudName = uri.getPath().replaceFirst("^/", "");
        }

        if (apiKey.isBlank() || apiSecret.isBlank() || cloudName == null || cloudName.isBlank()) {
            throw new IllegalArgumentException("CLOUDINARY_URL is missing required values");
        }

        return ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        );
    }

    private UploadResponse uploadHeroToCloudinary(MultipartFile file, String mediaType) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String suffix = extension != null ? "." + extension : "";
        String publicId = "hero_" + UUID.randomUUID();

        Path tempFile = Files.createTempFile("xfrizon-admin-hero-", suffix);
        try {
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
            return new UploadResponse(secureUrl, finalName, file.getSize(), mediaType);
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    private UploadResponse uploadHeroToLocalDisk(MultipartFile file, String mediaType) throws IOException {
        File uploadDirectory = new File(uploadDir);
        if (!uploadDirectory.exists()) {
            boolean created = uploadDirectory.mkdirs();
            if (created) {
                log.info("Created upload directory: {}", uploadDirectory.getAbsolutePath());
            } else {
                log.warn("Failed to create upload directory: {}", uploadDirectory.getAbsolutePath());
            }
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String filename = "hero_" + UUID.randomUUID() + (extension != null ? "." + extension : "");
        Path filePath = Paths.get(uploadDirectory.getAbsolutePath(), filename);

        Files.copy(file.getInputStream(), filePath);
        String fileUrl = "/uploads/" + filename;

        return new UploadResponse(fileUrl, filename, file.getSize(), mediaType);
    }

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

            String mediaType = isVideo ? "video" : "image";
                if (cloudinaryRequired && !isCloudinaryActive()) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Cloudinary is required but not configured"));
                }

            UploadResponse uploadResponse = isCloudinaryActive()
                    ? uploadHeroToCloudinary(file, mediaType)
                    : uploadHeroToLocalDisk(file, mediaType);

            log.info("Hero slide uploaded successfully: {} -> {}", file.getOriginalFilename(), uploadResponse.url);
            return ResponseEntity.ok(uploadResponse);

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
