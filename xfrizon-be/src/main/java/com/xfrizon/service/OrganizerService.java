package com.xfrizon.service;

import com.xfrizon.dto.AdminOrganizerManagementRow;
import com.xfrizon.dto.OrganizerProfileUpdateRequest;
import com.xfrizon.dto.UserResponse;
import com.xfrizon.entity.Event;
import com.xfrizon.entity.PaymentRecord;
import com.xfrizon.entity.TicketTier;
import com.xfrizon.entity.User;
import com.xfrizon.repository.EventRepository;
import com.xfrizon.repository.PaymentRecordRepository;
import com.xfrizon.repository.TicketTierRepository;
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
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.ArrayList;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class OrganizerService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final TicketTierRepository ticketTierRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final ObjectMapper objectMapper;

    @Value("${upload.directory:uploads/}")
    private String uploadDir;

    public OrganizerService(
            UserRepository userRepository,
            EventRepository eventRepository,
            TicketTierRepository ticketTierRepository,
            PaymentRecordRepository paymentRecordRepository,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.ticketTierRepository = ticketTierRepository;
        this.paymentRecordRepository = paymentRecordRepository;
        this.objectMapper = objectMapper;
    }

    public List<AdminOrganizerManagementRow> getAdminOrganizerManagementRows() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == User.UserRole.ORGANIZER)
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToAdminManagementRow)
                .collect(Collectors.toList());
    }

    private AdminOrganizerManagementRow mapToAdminManagementRow(User organizer) {
        List<Event> organizerEvents = eventRepository.findByOrganizerId(organizer.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();

        int ticketsListed = 0;
        int ticketsSold = 0;

        for (Event event : organizerEvents) {
            List<TicketTier> tiers = ticketTierRepository.findByEventIdOrderByDisplayOrder(event.getId());
            for (TicketTier tier : tiers) {
                ticketsListed += tier.getQuantity() != null ? tier.getQuantity() : 0;
                ticketsSold += tier.getQuantitySold() != null ? tier.getQuantitySold() : 0;
            }
        }

        List<PaymentRecord> successfulPayments = paymentRecordRepository.findAllPaymentsByOrganizer(organizer.getId());
        BigDecimal payout = successfulPayments.stream()
                .map(payment -> payment.getOrganizerAmount() != null ? payment.getOrganizerAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String organizerName = (organizer.getName() != null && !organizer.getName().isBlank())
                ? organizer.getName()
                : String.format("%s %s", safeText(organizer.getFirstName()), safeText(organizer.getLastName())).trim();

        String payoutMethod = (organizer.getStripeAccountId() != null && !organizer.getStripeAccountId().isBlank())
                ? "Stripe Connect"
                : "Manual";

        return AdminOrganizerManagementRow.builder()
                .organizerId(organizer.getId())
                .name(organizerName.isBlank() ? "N/A" : organizerName)
                .phoneNumber(safeText(organizer.getPhoneNumber()))
                .location(safeText(organizer.getLocation()))
                .email(safeText(organizer.getEmail()))
                .ticketsListed(ticketsListed)
                .ticketsSold(ticketsSold)
                .payout(payout)
                .payoutMethod(payoutMethod)
                .dateJoined(organizer.getCreatedAt())
                .build();
    }

    private String safeText(String value) {
        return value == null || value.isBlank() ? "N/A" : value;
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

        if (updateData.getMedia() != null && !updateData.getMedia().isEmpty()) {
            try {
                user.setMedia(objectMapper.writeValueAsString(updateData.getMedia()));
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid media payload");
            }
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

        // Validate file is an image or video
        String contentType = file.getContentType();
        if (contentType == null ||
                (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
            throw new IllegalArgumentException("Please upload a valid image or video file");
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

        // Validate file is an image or video
        String contentType = file.getContentType();
        if (contentType == null ||
                (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
            throw new IllegalArgumentException("Please upload a valid image or video file");
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

        try {
            List<UserResponse.MediaItem> mediaItems = new ArrayList<>();
            if (user.getMedia() != null && !user.getMedia().isEmpty()) {
                mediaItems = objectMapper.readValue(
                        user.getMedia(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, UserResponse.MediaItem.class));
            }

            mediaItems.add(UserResponse.MediaItem.builder()
                    .url(mediaUrl)
                    .caption("")
                    .type(contentType.startsWith("video/") ? "video" : "image")
                    .build());

            user.setMedia(objectMapper.writeValueAsString(mediaItems));
            userRepository.save(user);
        } catch (Exception e) {
            log.warn("Failed to persist organizer media list for organizer {}: {}", organizerId, e.getMessage());
        }

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
                // Backward compatibility: support legacy media stored as array of URL strings
                try {
                    List<String> mediaUrls = objectMapper.readValue(user.getMedia(),
                            objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
                    media = mediaUrls.stream()
                            .map(url -> UserResponse.MediaItem.builder()
                                    .url(url)
                                    .caption("")
                                    .type(url != null && url.matches("(?i).*(\\.mp4|\\.mov|\\.webm|\\.m4v|\\.ogg)(\\?.*)?$") ? "video" : "image")
                                    .build())
                            .collect(Collectors.toList());
                } catch (Exception fallbackEx) {
                    media = List.of();
                }
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
