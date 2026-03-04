package com.xfrizon.service;

import com.xfrizon.dto.OrganizerProfileUpdateRequest;
import com.xfrizon.dto.UserResponse;
import com.xfrizon.entity.User;
import com.xfrizon.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@Slf4j
public class OrganizerService {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Value("${upload.directory:uploads/}")
    private String uploadDir;

    public OrganizerService(UserRepository userRepository, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Get organizer profile
     */
    public UserResponse getOrganizerProfile(Long organizerId) {
        User user = userRepository.findByIdAndIsActiveTrue(organizerId)
                .orElse(null);

        if (user == null || !user.getRole().equals(User.UserRole.ORGANIZER)) {
            return null;
        }

        return mapToUserResponse(user);
    }

    /**
     * Update organizer profile
     */
    public UserResponse updateOrganizerProfile(Long organizerId, OrganizerProfileUpdateRequest updateData) {
        User user = userRepository.findByIdAndIsActiveTrue(organizerId)
                .orElse(null);

        if (user == null || !user.getRole().equals(User.UserRole.ORGANIZER)) {
            return null;
        }

        // Update fields
        if (updateData.getName() != null && !updateData.getName().isEmpty()) {
            // Store organizer name in both name and firstName fields
            user.setName(updateData.getName());
            user.setFirstName(updateData.getName());
        }

        // Only update email if it's different from current email
        if (updateData.getEmail() != null && !updateData.getEmail().isEmpty() 
                && !updateData.getEmail().equals(user.getEmail())) {
            // Check if new email already exists for another user
            if (userRepository.findByEmail(updateData.getEmail()).isPresent()) {
                throw new IllegalArgumentException("Email already in use");
            }
            user.setEmail(updateData.getEmail());
        }

        if (updateData.getPhone() != null && !updateData.getPhone().isEmpty()) {
            user.setPhoneNumber(updateData.getPhone());
        }
        if (updateData.getLocation() != null && !updateData.getLocation().isEmpty()) {
            user.setLocation(updateData.getLocation());
        }
        if (updateData.getAddress() != null && !updateData.getAddress().isEmpty()) {
            user.setAddress(updateData.getAddress());
        }
        if (updateData.getDescription() != null && !updateData.getDescription().isEmpty()) {
            user.setBio(updateData.getDescription());
        }
        if (updateData.getLogo() != null && !updateData.getLogo().isEmpty()) {
            user.setLogo(updateData.getLogo());
            user.setProfilePicture(updateData.getLogo());
        }
        if (updateData.getCoverPhoto() != null && !updateData.getCoverPhoto().isEmpty()) {
            user.setCoverPhoto(updateData.getCoverPhoto());
        }

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    /**
     * Upload cover photo for organizer
     */
    public String uploadCoverPhoto(Long organizerId, MultipartFile file) throws IOException {
        User user = userRepository.findByIdAndIsActiveTrue(organizerId)
                .orElse(null);

        if (user == null || !user.getRole().equals(User.UserRole.ORGANIZER)) {
            throw new IllegalArgumentException("Organizer not found");
        }

        // Validate file is an image
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Please upload a valid image file");
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

        log.info("Organizer cover photo uploaded successfully: {} at {}", filename, filePath.toAbsolutePath());

        // Update organizer profile with cover photo URL
        String coverPhotoUrl = "/api/v1/uploads/" + filename;
        user.setCoverPhoto(coverPhotoUrl);
        userRepository.save(user);

        return coverPhotoUrl;
    }

    /**
     * Upload media for organizer
     */
    public String uploadMedia(Long organizerId, MultipartFile file) throws IOException {
        User user = userRepository.findByIdAndIsActiveTrue(organizerId)
                .orElse(null);

        if (user == null || !user.getRole().equals(User.UserRole.ORGANIZER)) {
            throw new IllegalArgumentException("Organizer not found");
        }

        // Validate file is an image
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Please upload a valid image file");
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

        log.info("Organizer media uploaded successfully: {} at {}", filename, filePath.toAbsolutePath());

        String mediaUrl = "/api/v1/uploads/" + filename;
        return mediaUrl;
    }

    /**
     * Map User entity to UserResponse DTO
     */
    private UserResponse mapToUserResponse(User user) {
        List<String> favoriteArtists = null;
        List<UserResponse.MediaItem> media = null;

        // Parse favorite artists with comprehensive error handling
        if (user.getFavoriteArtists() != null && !user.getFavoriteArtists().isEmpty()) {
            try {
                favoriteArtists = objectMapper.readValue(user.getFavoriteArtists(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
            } catch (Exception e) {
                log.warn("Error parsing favoriteArtists JSON: {}", e.getMessage());
                // If parsing fails, split by comma or return empty list
                try {
                    if (user.getFavoriteArtists().contains(",")) {
                        favoriteArtists = Arrays.asList(user.getFavoriteArtists().split(","));
                    } else {
                        favoriteArtists = List.of(user.getFavoriteArtists().trim());
                    }
                } catch (Exception fallbackEx) {
                    favoriteArtists = List.of();
                }
            }
        } else {
            favoriteArtists = List.of();
        }

        // Parse media with comprehensive error handling
        if (user.getMedia() != null && !user.getMedia().isEmpty()) {
            try {
                media = objectMapper.readValue(user.getMedia(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, UserResponse.MediaItem.class));
            } catch (Exception e) {
                log.warn("Error parsing media JSON: {}", e.getMessage());
                // If parsing fails, return empty list
                media = List.of();
            }
        } else {
            media = List.of();
        }

        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName() != null ? user.getLastName() : "")
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .location(user.getLocation())
                .address(user.getAddress())
                .profilePicture(user.getProfilePicture())
                .logo(user.getLogo() != null ? user.getLogo() : user.getProfilePicture())
                .bio(user.getBio() != null ? user.getBio() : "")
                .coverPhoto(user.getCoverPhoto() != null ? user.getCoverPhoto() : "")
                .name(user.getName())
                .favoriteArtists(favoriteArtists)
                .media(media)
                .role(user.getRole().toString())
                .isActive(user.getIsActive())
                .isEmailVerified(user.getIsEmailVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    /**
     * Set manual payout preference for organizer
     */
    public void setManualPayoutPreference(Long organizerId, boolean prefersManual) {
        User user = userRepository.findByIdAndIsActiveTrue(organizerId)
                .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

        if (!user.getRole().equals(User.UserRole.ORGANIZER)) {
            throw new IllegalArgumentException("User is not an organizer");
        }

        user.setPrefersManualPayout(prefersManual);
        userRepository.save(user);
        log.info("Organizer {} manual payout preference set to: {}", organizerId, prefersManual);
    }
}
