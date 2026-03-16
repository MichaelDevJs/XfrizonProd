package com.xfrizon.service;

import com.xfrizon.dto.CreatePartnerOfferRequest;
import com.xfrizon.dto.CreatePartnerRequest;
import com.xfrizon.dto.PartnerApiKeyResponse;
import com.xfrizon.dto.PartnerOfferResponse;
import com.xfrizon.dto.PartnerProfileUpdateRequest;
import com.xfrizon.dto.PartnerRegistrationRequest;
import com.xfrizon.dto.PartnerResponse;
import com.xfrizon.entity.Partner;
import com.xfrizon.entity.PartnerOffer;
import com.xfrizon.entity.User;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xfrizon.repository.PartnerOfferRepository;
import com.xfrizon.repository.PartnerRepository;
import com.xfrizon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PartnerService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int PARTNER_TEXT_MAX_LENGTH = 1000;

    private final PartnerRepository partnerRepository;
    private final PartnerOfferRepository offerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    // ─── Public reads ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PartnerResponse> getAllActivePartners() {
        return partnerRepository.findByIsActiveTrueOrderByNameAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PartnerResponse> getByCategory(String category) {
        Partner.PartnerCategory cat = Partner.PartnerCategory.valueOf(category.toUpperCase());
        return partnerRepository.findByCategoryAndIsActiveTrueOrderByNameAsc(cat)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PartnerResponse> searchByName(String query) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.isEmpty()) {
            return getAllActivePartners();
        }
        return partnerRepository.findByIsActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(normalized)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PartnerResponse getById(Long id) {
        Partner partner = partnerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Partner not found"));
        if (!Boolean.TRUE.equals(partner.getIsActive())) {
            throw new IllegalArgumentException("Partner profile is not publicly available");
        }
        return toResponseWithOffers(partner);
    }

    @Transactional(readOnly = true)
    public List<PartnerResponse> getAllForAdmin() {
        return partnerRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PartnerResponse getOwnProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Partner partner = findPartnerByUser(user);
        return toResponse(partner);
    }

    public PartnerResponse registerPartner(PartnerRegistrationRequest req) {
        ensurePartnerUserAccount(req);

        Partner partner = partnerRepository.findFirstByContactEmailIgnoreCase(req.getContactEmail())
                .orElseGet(() -> Partner.builder()
                        .isActive(false)
                        .build());

        partner.setName(req.getName());
        partner.setDescription(req.getDescription());
        partner.setLogoUrl(req.getBrandLogo());
        partner.setCategory(Partner.PartnerCategory.valueOf(req.getIndustry().toUpperCase()));
        partner.setType(Partner.PartnerType.valueOf(req.getType().toUpperCase()));
        partner.setWebsite(req.getWebsite());
        partner.setLocation(req.getLocation());
        partner.setAddress(req.getAddress());
        partner.setContactEmail(req.getContactEmail());
        partner.setContactPhone(req.getContactPhone());

        Partner saved = partnerRepository.save(partner);
        if (saved.getApiKeyHash() == null || saved.getApiKeyHash().isBlank()) {
            rotateApiKey(saved.getId());
        }
        return toResponse(saved);
    }

    public PartnerResponse updateOwnProfile(Long userId, PartnerProfileUpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Partner partner = findPartnerByUser(user);
        applyOwnProfileUpdate(user, partner, req);

        userRepository.save(user);
        Partner savedPartner = partnerRepository.save(partner);
        return toResponse(savedPartner);
    }

    // ─── Admin mutations ──────────────────────────────────────────────────────

    public PartnerResponse createPartner(CreatePartnerRequest req) {
        Partner partner = Partner.builder()
                .name(req.getName())
                .description(req.getDescription())
                .logoUrl(req.getLogoUrl())
                .category(Partner.PartnerCategory.valueOf(req.getCategory().toUpperCase()))
                .type(Partner.PartnerType.valueOf(req.getType().toUpperCase()))
                .website(req.getWebsite())
                .location(req.getLocation())
                .address(req.getAddress())
                .contactEmail(req.getContactEmail())
                .contactPhone(req.getContactPhone())
                .isActive(true)
                .build();
        Partner saved = partnerRepository.save(partner);
        rotateApiKey(saved.getId());
        return toResponse(saved);
    }

    public PartnerResponse updatePartner(Long id, CreatePartnerRequest req) {
        Partner partner = partnerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Partner not found"));
        partner.setName(req.getName());
        partner.setDescription(req.getDescription());
        if (req.getLogoUrl() != null) partner.setLogoUrl(req.getLogoUrl());
        partner.setCategory(Partner.PartnerCategory.valueOf(req.getCategory().toUpperCase()));
        partner.setType(Partner.PartnerType.valueOf(req.getType().toUpperCase()));
        partner.setWebsite(req.getWebsite());
        partner.setLocation(req.getLocation());
        partner.setAddress(req.getAddress());
        partner.setContactEmail(req.getContactEmail());
        partner.setContactPhone(req.getContactPhone());
        return toResponse(partnerRepository.save(partner));
    }

    public void togglePartnerActive(Long id, boolean active) {
        Partner partner = partnerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Partner not found"));
        partner.setIsActive(active);
        partnerRepository.save(partner);
    }

    public PartnerOfferResponse createOffer(CreatePartnerOfferRequest req) {
        Partner partner = partnerRepository.findById(req.getPartnerId())
                .orElseThrow(() -> new IllegalArgumentException("Partner not found"));
        PartnerOffer offer = PartnerOffer.builder()
                .partner(partner)
                .title(req.getTitle())
                .description(req.getDescription())
                .pointsCost(req.getPointsCost())
                .discountPercent(req.getDiscountPercent())
                .isActive(true)
                .build();
        return toOfferResponse(offerRepository.save(offer));
    }

    public PartnerApiKeyResponse rotateApiKey(Long partnerId) {
        Partner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new IllegalArgumentException("Partner not found"));

        String rawKey = generatePartnerApiKey();
        String hash = sha256(rawKey);
        String prefix = rawKey.substring(0, Math.min(16, rawKey.length()));

        partner.setApiKeyHash(hash);
        partner.setApiKeyPrefix(prefix);
        partnerRepository.save(partner);

        return PartnerApiKeyResponse.builder()
                .partnerId(partner.getId())
                .partnerName(partner.getName())
                .apiKey(rawKey)
                .apiKeyPrefix(prefix)
                .build();
    }

    @Transactional(readOnly = true)
    public boolean validatePartnerApiKey(Partner partner, String apiKey) {
        if (partner == null || apiKey == null || apiKey.isBlank()) return false;
        if (partner.getApiKeyHash() == null || partner.getApiKeyHash().isBlank()) return false;
        return partner.getApiKeyHash().equals(sha256(apiKey.trim()));
    }

    public void seedDefaultPartnersAndOffers() {
        if (!partnerRepository.findByIsActiveTrueOrderByNameAsc().isEmpty()) {
            return;
        }

        Partner food = createSeedPartner("BiteHub", "Food discounts for XF users", Partner.PartnerCategory.FOOD, Partner.PartnerType.IN_PERSON, null, "Downtown Food Court");
        Partner salon = createSeedPartner("GlowCut Studio", "Hair and grooming offers", Partner.PartnerCategory.HAIR_SALON, Partner.PartnerType.BOTH, "https://glowcut.example.com", "City Mall - Level 2");
        Partner fashion = createSeedPartner("StreetDrip", "Fashion essentials and streetwear", Partner.PartnerCategory.FASHION, Partner.PartnerType.ONLINE, "https://streetdrip.example.com", null);

        createSeedOffer(food, "Lunch Saver", "Get 10% off your food order", 500, 10);
        createSeedOffer(food, "Big Meal Deal", "Get 20% off selected combos", 1000, 20);

        createSeedOffer(salon, "Fresh Cut", "10% off haircut and wash", 500, 10);
        createSeedOffer(salon, "Premium Style", "20% off any styling package", 1200, 20);

        createSeedOffer(fashion, "Cart Discount", "10% off online order", 700, 10);
        createSeedOffer(fashion, "Premium Drop", "20% off selected products", 1500, 20);
    }

    public void toggleOfferActive(Long offerId, boolean active) {
        PartnerOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));
        offer.setIsActive(active);
        offerRepository.save(offer);
    }

    private Partner createSeedPartner(
            String name,
            String description,
            Partner.PartnerCategory category,
            Partner.PartnerType type,
            String website,
            String location
    ) {
        Partner partner = Partner.builder()
                .name(name)
                .description(description)
                .category(category)
                .type(type)
                .website(website)
                .location(location)
                .address(location)
                .isActive(true)
                .build();
        Partner saved = partnerRepository.save(partner);
        rotateApiKey(saved.getId());
        return saved;
    }

    private void createSeedOffer(Partner partner, String title, String description, int pointsCost, int discountPercent) {
        PartnerOffer offer = PartnerOffer.builder()
                .partner(partner)
                .title(title)
                .description(description)
                .pointsCost(pointsCost)
                .discountPercent(discountPercent)
                .isActive(true)
                .build();
        offerRepository.save(offer);
    }


    private void ensurePartnerUserAccount(PartnerRegistrationRequest req) {
        String contactEmail = req.getContactEmail();
        if (contactEmail == null || contactEmail.isBlank()) {
            return;
        }

        String normalizedEmail = contactEmail.trim();

        userRepository.findByEmail(normalizedEmail).ifPresentOrElse(user -> {
            String primaryRole = user.getRole() == null ? User.UserRole.USER.name() : user.getRole().name();
            user.setRoles(mergeRoles(user.getRoles(), primaryRole, "PARTNER"));
            if ((user.getName() == null || user.getName().isBlank()) && req.getName() != null) {
                user.setName(req.getName().trim());
            }
            if ((user.getPhoneNumber() == null || user.getPhoneNumber().isBlank()) && req.getContactPhone() != null) {
                user.setPhoneNumber(req.getContactPhone().trim());
            }
            userRepository.save(user);
        }, () -> {
            if (req.getLoginPassword() == null || req.getLoginPassword().isBlank()) {
                throw new IllegalArgumentException("Password is required to create a partner login account");
            }

            String cleanedName = req.getName() == null ? "Partner User" : req.getName().trim();
            String[] parts = cleanedName.split("\\s+");
            String firstName = parts.length > 0 && !parts[0].isBlank() ? parts[0] : "Partner";
            String lastName = parts.length > 1
                    ? String.join(" ", java.util.Arrays.copyOfRange(parts, 1, parts.length)).trim()
                    : "User";

            User newUser = User.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .name(cleanedName)
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(req.getLoginPassword()))
                    .phoneNumber(req.getContactPhone())
                    .location(req.getLocation())
                    .address(req.getAddress())
                    .profilePicture(req.getBrandLogo())
                    .logo(req.getBrandLogo())
                    .role(User.UserRole.USER)
                    .roles(mergeRoles(null, User.UserRole.USER.name(), "PARTNER"))
                    .isActive(true)
                    .isEmailVerified(false)
                    .build();

            userRepository.save(newUser);
        });
    }

    private Partner findPartnerByUser(User user) {
        String email = user.getEmail() == null ? "" : user.getEmail().trim();
        if (email.isBlank()) {
            throw new IllegalArgumentException("Partner account has no email");
        }

        return partnerRepository.findFirstByContactEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Partner profile not found"));
    }

    private void applyOwnProfileUpdate(User user, Partner partner, PartnerProfileUpdateRequest req) {
        String requestedEmail = normalizeValue(req.getContactEmail());
        if (requestedEmail != null && !requestedEmail.equalsIgnoreCase(user.getEmail())) {
            userRepository.findByEmail(requestedEmail).ifPresent(existing -> {
                if (!existing.getId().equals(user.getId())) {
                    throw new IllegalArgumentException("Email already registered");
                }
            });
            user.setEmail(requestedEmail);
            partner.setContactEmail(requestedEmail);
        }

        if (normalizeValue(req.getName()) != null) {
            String name = normalizeValue(req.getName());
            partner.setName(name);
            user.setName(name);
            if (user.getFirstName() == null || user.getFirstName().isBlank()) {
                user.setFirstName(name);
            }
        }

        if (req.getCategory() != null && !req.getCategory().isBlank()) {
            partner.setCategory(Partner.PartnerCategory.valueOf(req.getCategory().trim().toUpperCase(Locale.ROOT)));
        }

        if (req.getType() != null && !req.getType().isBlank()) {
            partner.setType(Partner.PartnerType.valueOf(req.getType().trim().toUpperCase(Locale.ROOT)));
        }

        partner.setDescription(normalizeLimited(req.getDescription(), PARTNER_TEXT_MAX_LENGTH, "description"));
        partner.setLogoUrl(normalizeValue(req.getLogoUrl()));
        partner.setCoverPhoto(normalizeValue(req.getCoverPhoto()));
        partner.setLocation(normalizeValue(req.getLocation()));
        partner.setAddress(normalizeValue(req.getAddress()));
        partner.setWebsite(normalizeValue(req.getWebsite()));
        partner.setInstagram(normalizeValue(req.getInstagram()));
        partner.setTwitter(normalizeValue(req.getTwitter()));
        partner.setContactPhone(normalizeValue(req.getContactPhone()));
        partner.setAboutPrimaryTitle(normalizeValue(req.getAboutPrimaryTitle()));
        partner.setAboutPrimaryBody(normalizeLimited(req.getAboutPrimaryBody(), PARTNER_TEXT_MAX_LENGTH, "aboutPrimaryBody"));
        partner.setAboutSecondaryTitle(normalizeValue(req.getAboutSecondaryTitle()));
        partner.setAboutSecondaryBody(normalizeLimited(req.getAboutSecondaryBody(), PARTNER_TEXT_MAX_LENGTH, "aboutSecondaryBody"));
        partner.setHeadlineTitle(normalizeValue(req.getHeadlineTitle()));
        partner.setHeadlineBody(normalizeLimited(req.getHeadlineBody(), PARTNER_TEXT_MAX_LENGTH, "headlineBody"));
        partner.setHeadlineLinkLabel(normalizeValue(req.getHeadlineLinkLabel()));
        partner.setHeadlineLinkUrl(normalizeValue(req.getHeadlineLinkUrl()));
        partner.setCoverMedia(writeMediaItems(req.getCoverMedia()));
        partner.setGalleryMedia(writeMediaItems(req.getGallery()));

        String profilePhotoUrl = normalizeValue(req.getProfilePhotoUrl());
        user.setLogo(partner.getLogoUrl());
        user.setProfilePicture(firstNonBlank(profilePhotoUrl, partner.getLogoUrl()));
        user.setPhoneNumber(partner.getContactPhone());
        user.setLocation(partner.getLocation());
        user.setAddress(partner.getAddress());
        user.setWebsite(partner.getWebsite());
        user.setInstagram(partner.getInstagram());
        user.setTwitter(partner.getTwitter());
        user.setBio(firstNonBlank(partner.getAboutPrimaryBody(), partner.getDescription()));
        user.setCoverPhoto(firstNonBlank(partner.getCoverPhoto(), firstMediaUrl(req.getCoverMedia())));
        user.setRoles(mergeRoles(user.getRoles(), user.getRole() == null ? User.UserRole.USER.name() : user.getRole().name(), "PARTNER"));
    }

    private String firstMediaUrl(List<PartnerProfileUpdateRequest.MediaItem> items) {
        if (items == null || items.isEmpty()) return null;
        for (PartnerProfileUpdateRequest.MediaItem item : items) {
            String value = normalizeValue(item == null ? null : item.getUrl());
            if (value != null) return value;
        }
        return null;
    }

    private String normalizeValue(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeLimited(String value, int maxLength, String fieldName) {
        String normalized = normalizeValue(value);
        if (normalized == null) {
            return null;
        }
        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + " must be at most " + maxLength + " characters");
        }
        return normalized;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalizeValue(value);
            if (normalized != null) return normalized;
        }
        return null;
    }

    private String writeMediaItems(List<PartnerProfileUpdateRequest.MediaItem> items) {
        if (items == null) {
            return null;
        }

        List<PartnerProfileUpdateRequest.MediaItem> normalized = items.stream()
                .filter(item -> item != null && normalizeValue(item.getUrl()) != null)
                .map(item -> PartnerProfileUpdateRequest.MediaItem.builder()
                        .url(normalizeValue(item.getUrl()))
                        .caption(normalizeValue(item.getCaption()))
                        .type(normalizeValue(item.getType()))
                        .build())
                .collect(Collectors.toList());

        if (normalized.isEmpty()) {
            return "[]";
        }

        try {
            return objectMapper.writeValueAsString(normalized);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Could not store partner media", e);
        }
    }

    private List<PartnerResponse.MediaItem> parseMediaItems(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(rawValue, new TypeReference<List<PartnerResponse.MediaItem>>() {});
        } catch (Exception e) {
            log.warn("Could not parse partner media payload", e);
            return List.of();
        }
    }

    private String mergeRoles(String currentRoles, String... requiredRoles) {
        Set<String> merged = new LinkedHashSet<>();

        if (currentRoles != null && !currentRoles.isBlank()) {
            for (String role : currentRoles.split(",")) {
                String normalized = role == null ? "" : role.trim().toUpperCase(Locale.ROOT);
                if (!normalized.isBlank()) {
                    merged.add(normalized);
                }
            }
        }

        for (String role : requiredRoles) {
            String normalized = role == null ? "" : role.trim().toUpperCase(Locale.ROOT);
            if (!normalized.isBlank()) {
                merged.add(normalized);
            }
        }

        return String.join(",", merged);
    }

    private String generatePartnerApiKey() {
        byte[] bytes = new byte[18];
        SECURE_RANDOM.nextBytes(bytes);
        return "XF_PARTNER_" + HexFormat.of().withUpperCase().formatHex(bytes);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed).toLowerCase(Locale.ROOT);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    // ─── Mapping helpers ──────────────────────────────────────────────────────

    private PartnerResponse toResponse(Partner p) {
        List<PartnerOfferResponse> offers = offerRepository
                .findByPartnerIdAndIsActiveTrueOrderByPointsCostAsc(p.getId())
                .stream().map(this::toOfferResponse).collect(Collectors.toList());
        String profilePhotoUrl = null;
        if (p.getContactEmail() != null && !p.getContactEmail().isBlank()) {
            profilePhotoUrl = userRepository.findByEmail(p.getContactEmail().trim())
                .map(User::getProfilePicture)
                .orElse(null);
        }
        return PartnerResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .logoUrl(p.getLogoUrl())
            .profilePhotoUrl(profilePhotoUrl)
                .industry(p.getCategory().name())
                .category(p.getCategory().name())
                .type(p.getType().name())
                .website(p.getWebsite())
                .instagram(p.getInstagram())
                .twitter(p.getTwitter())
                .location(p.getLocation())
                .address(p.getAddress())
                .contactEmail(p.getContactEmail())
                .contactPhone(p.getContactPhone())
                .coverPhoto(p.getCoverPhoto())
                .coverMedia(parseMediaItems(p.getCoverMedia()))
                .gallery(parseMediaItems(p.getGalleryMedia()))
                .aboutPrimaryTitle(p.getAboutPrimaryTitle())
                .aboutPrimaryBody(p.getAboutPrimaryBody())
                .aboutSecondaryTitle(p.getAboutSecondaryTitle())
                .aboutSecondaryBody(p.getAboutSecondaryBody())
                .headlineTitle(p.getHeadlineTitle())
                .headlineBody(p.getHeadlineBody())
                .headlineLinkLabel(p.getHeadlineLinkLabel())
                .headlineLinkUrl(p.getHeadlineLinkUrl())
                .isActive(p.getIsActive())
                .offers(offers)
                .build();
    }

    private PartnerResponse toResponseWithOffers(Partner p) {
        return toResponse(p);
    }

    private PartnerOfferResponse toOfferResponse(PartnerOffer o) {
        return PartnerOfferResponse.builder()
                .id(o.getId())
                .partnerId(o.getPartner().getId())
                .partnerName(o.getPartner().getName())
                .partnerCategory(o.getPartner().getCategory().name())
                .title(o.getTitle())
                .description(o.getDescription())
                .pointsCost(o.getPointsCost())
                .discountPercent(o.getDiscountPercent())
                .build();
    }
}






