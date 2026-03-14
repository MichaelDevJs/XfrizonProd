package com.xfrizon.service;

import com.xfrizon.dto.CreatePartnerOfferRequest;
import com.xfrizon.dto.CreatePartnerRequest;
import com.xfrizon.dto.PartnerApiKeyResponse;
import com.xfrizon.dto.PartnerOfferResponse;
import com.xfrizon.dto.PartnerRegistrationRequest;
import com.xfrizon.dto.PartnerResponse;
import com.xfrizon.entity.Partner;
import com.xfrizon.entity.PartnerOffer;
import com.xfrizon.repository.PartnerOfferRepository;
import com.xfrizon.repository.PartnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PartnerService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PartnerRepository partnerRepository;
    private final PartnerOfferRepository offerRepository;

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

    public PartnerResponse registerPartner(PartnerRegistrationRequest req) {
        Partner partner = Partner.builder()
                .name(req.getName())
                .description(req.getDescription())
                .logoUrl(req.getBrandLogo())
                .category(Partner.PartnerCategory.valueOf(req.getIndustry().toUpperCase()))
                .type(Partner.PartnerType.valueOf(req.getType().toUpperCase()))
                .website(req.getWebsite())
                .location(req.getLocation())
                .address(req.getAddress())
                .contactEmail(req.getContactEmail())
                .contactPhone(req.getContactPhone())
                .isActive(false)
                .build();

        Partner saved = partnerRepository.save(partner);
        rotateApiKey(saved.getId());
        return toResponse(saved);
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
        return PartnerResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .logoUrl(p.getLogoUrl())
                .industry(p.getCategory().name())
                .category(p.getCategory().name())
                .type(p.getType().name())
                .website(p.getWebsite())
                .location(p.getLocation())
                .address(p.getAddress())
                .contactEmail(p.getContactEmail())
                .contactPhone(p.getContactPhone())
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
