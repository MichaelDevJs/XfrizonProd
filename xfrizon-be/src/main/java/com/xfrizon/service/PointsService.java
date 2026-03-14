package com.xfrizon.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.xfrizon.dto.PointsTransactionResponse;
import com.xfrizon.dto.PointsWalletResponse;
import com.xfrizon.dto.RedeemRequest;
import com.xfrizon.dto.RedemptionOrderResponse;
import com.xfrizon.entity.*;
import com.xfrizon.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PointsService {

    /** Points awarded per currency unit of ticket subtotal */
    private static final int POINTS_PER_UNIT = 10;
    private static final int MAX_DAILY_REDEMPTIONS = 3;

    private final PointsWalletRepository walletRepository;
    private final PointsTransactionRepository transactionRepository;
    private final PartnerOfferRepository offerRepository;
    private final RedemptionOrderRepository redemptionOrderRepository;
    private final UserRepository userRepository;

    // ─── Tier logic ───────────────────────────────────────────────────────────

    public static String tierName(int balance) {
        if (balance >= 2000) return "GOLD";
        if (balance >= 1000) return "SILVER";
        if (balance >= 500)  return "BRONZE";
        return "NONE";
    }

    public static int tierDiscount(int balance) {
        if (balance >= 2000) return 20;
        if (balance >= 1000) return 15;
        if (balance >= 500)  return 10;
        return 0;
    }

    // ─── Wallet retrieval ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PointsWalletResponse getWallet(Long userId) {
        PointsWallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> createWallet(userId));
        return toWalletResponse(wallet);
    }

    @Transactional(readOnly = true)
    public Page<PointsTransactionResponse> getLedger(Long userId, Pageable pageable) {
        return transactionRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toTransactionResponse);
    }

    // ─── Awarding points ──────────────────────────────────────────────────────

    /**
     * Called by TicketService after a successful ticket purchase.
     * Awards POINTS_PER_UNIT for every currency unit of the ticket subtotal.
     */
    public void awardPointsForTicketPurchase(Long userId, BigDecimal subtotal, Long ticketId) {
        if (subtotal == null || subtotal.compareTo(BigDecimal.ZERO) <= 0) return;

        int earned = subtotal.intValue() * POINTS_PER_UNIT;
        if (earned <= 0) return;

        PointsWallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> createWallet(userId));

        wallet.setAvailableBalance(wallet.getAvailableBalance() + earned);
        wallet.setLifetimeEarned(wallet.getLifetimeEarned() + earned);
        walletRepository.save(wallet);

        User user = userRepository.getReferenceById(userId);
        PointsTransaction tx = PointsTransaction.builder()
                .user(user)
                .points(earned)
                .type(PointsTransaction.TransactionType.EARNED)
                .sourceType("TICKET_PURCHASE")
                .sourceId(ticketId)
                .description("Earned " + earned + " points for ticket purchase")
                .build();
        transactionRepository.save(tx);

        log.info("Awarded {} points to user {} for ticket {}", earned, userId, ticketId);
    }

    // ─── Redemption ───────────────────────────────────────────────────────────

    /**
     * Redeem points for a partner offer.
     * Returns a RedemptionOrder with QR code (in-person) or coupon code (online).
     */
    public RedemptionOrderResponse redeem(Long userId, RedeemRequest request) {
        LocalDateTime dayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime dayEnd = dayStart.plusDays(1);
        long todaysRedemptions = redemptionOrderRepository
                .countByUserIdAndCreatedAtBetween(userId, dayStart, dayEnd);
        if (todaysRedemptions >= MAX_DAILY_REDEMPTIONS) {
            throw new IllegalArgumentException("Daily redemption limit reached (max " + MAX_DAILY_REDEMPTIONS + ")");
        }

        PartnerOffer offer = offerRepository.findById(request.getOfferId())
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        if (!offer.getIsActive()) {
            throw new IllegalArgumentException("This offer is no longer available");
        }

        PointsWallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Points wallet not found"));

        if (wallet.getAvailableBalance() < offer.getPointsCost()) {
            throw new IllegalArgumentException(
                    "Insufficient points. Required: " + offer.getPointsCost()
                    + ", Available: " + wallet.getAvailableBalance());
        }

        // Deduct points
        wallet.setAvailableBalance(wallet.getAvailableBalance() - offer.getPointsCost());
        walletRepository.save(wallet);

        // Record transaction
        User user = userRepository.getReferenceById(userId);
        PointsTransaction tx = PointsTransaction.builder()
                .user(user)
                .points(-offer.getPointsCost())
                .type(PointsTransaction.TransactionType.REDEEMED)
                .sourceType("REDEMPTION")
                .description("Redeemed " + offer.getPointsCost() + " points for \"" + offer.getTitle() + "\"")
                .build();
        transactionRepository.save(tx);

        // Generate unique token
        String token = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        Partner partner = offer.getPartner();
        String couponCode = null;
        String qrCodeDataUri = null;

        // Online → coupon code; in-person / both → QR code
        if (partner.getType() == Partner.PartnerType.ONLINE) {
            couponCode = "XF-" + token.substring(0, 8).toUpperCase();
        } else {
            // QR content: simple JSON payload
            String qrContent = "{\"token\":\"" + token + "\",\"discount\":" + offer.getDiscountPercent() + "}";
            qrCodeDataUri = generateQrDataUri(qrContent);
        }
        if (partner.getType() == Partner.PartnerType.BOTH) {
            couponCode = "XF-" + token.substring(0, 8).toUpperCase();
        }

        RedemptionOrder order = RedemptionOrder.builder()
                .user(user)
                .offer(offer)
                .pointsUsed(offer.getPointsCost())
                .discountPercent(offer.getDiscountPercent())
                .token(token)
                .couponCode(couponCode)
                .status(RedemptionOrder.RedemptionStatus.PENDING)
                .expiresAt(expiresAt)
                .build();
        redemptionOrderRepository.save(order);

        log.info("User {} redeemed {} points for offer {} (partner {})",
                userId, offer.getPointsCost(), offer.getId(), partner.getName());

        return RedemptionOrderResponse.builder()
                .id(order.getId())
                .partnerId(partner.getId())
                .partnerName(partner.getName())
                .partnerCategory(partner.getCategory().name())
                .partnerType(partner.getType().name())
                .offerTitle(offer.getTitle())
                .pointsUsed(offer.getPointsCost())
                .discountPercent(offer.getDiscountPercent())
                .qrCodeDataUri(qrCodeDataUri)
                .couponCode(couponCode)
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .expiresAt(expiresAt)
                .build();
    }

    /** Called by partner-facing verify endpoint to mark code as used. */
    public com.xfrizon.dto.RedemptionVerifyResponse verifyAndUse(String token, String partnerApiKey, PartnerService partnerService) {
        return redemptionOrderRepository.findByToken(token)
                .map(order -> {
                    Partner partner = order.getOffer().getPartner();
                    if (!partnerService.validatePartnerApiKey(partner, partnerApiKey)) {
                        return com.xfrizon.dto.RedemptionVerifyResponse.builder()
                                .valid(false).message("Unauthorized scanner key").build();
                    }
                    if (order.getStatus() == RedemptionOrder.RedemptionStatus.USED) {
                        return com.xfrizon.dto.RedemptionVerifyResponse.builder()
                                .valid(false).message("Already used").build();
                    }
                    if (order.getExpiresAt().isBefore(LocalDateTime.now())) {
                        order.setStatus(RedemptionOrder.RedemptionStatus.EXPIRED);
                        redemptionOrderRepository.save(order);
                        return com.xfrizon.dto.RedemptionVerifyResponse.builder()
                                .valid(false).message("Expired").build();
                    }
                    order.setStatus(RedemptionOrder.RedemptionStatus.USED);
                    order.setUsedAt(LocalDateTime.now());
                    redemptionOrderRepository.save(order);

                    String userName = order.getUser().getFirstName() + " " + order.getUser().getLastName();
                    return com.xfrizon.dto.RedemptionVerifyResponse.builder()
                            .valid(true)
                            .message("Apply " + order.getDiscountPercent() + "% discount")
                            .userName(userName)
                            .offerTitle(order.getOffer().getTitle())
                            .discountPercent(order.getDiscountPercent())
                            .partnerName(order.getOffer().getPartner().getName())
                            .build();
                })
                .orElse(com.xfrizon.dto.RedemptionVerifyResponse.builder()
                        .valid(false).message("Invalid QR code").build());
    }

    // ─── My redemptions ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<RedemptionOrderResponse> getMyRedemptions(Long userId, Pageable pageable) {
        return redemptionOrderRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toRedemptionResponse);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private PointsWallet createWallet(Long userId) {
        User user = userRepository.getReferenceById(userId);
        PointsWallet w = PointsWallet.builder()
                .user(user)
                .availableBalance(0)
                .lifetimeEarned(0)
                .build();
        return walletRepository.save(w);
    }

    private PointsWalletResponse toWalletResponse(PointsWallet w) {
        int balance = w.getAvailableBalance();
        return PointsWalletResponse.builder()
                .userId(w.getUser().getId())
                .availableBalance(balance)
                .lifetimeEarned(w.getLifetimeEarned())
                .tier(tierName(balance))
                .tierDiscount(tierDiscount(balance))
                .build();
    }

    private PointsTransactionResponse toTransactionResponse(PointsTransaction tx) {
        return PointsTransactionResponse.builder()
                .id(tx.getId())
                .points(tx.getPoints())
                .type(tx.getType().name())
                .sourceType(tx.getSourceType())
                .description(tx.getDescription())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private RedemptionOrderResponse toRedemptionResponse(RedemptionOrder o) {
        Partner partner = o.getOffer().getPartner();
        return RedemptionOrderResponse.builder()
                .id(o.getId())
                .partnerId(partner.getId())
                .partnerName(partner.getName())
                .partnerCategory(partner.getCategory().name())
                .partnerType(partner.getType().name())
                .offerTitle(o.getOffer().getTitle())
                .pointsUsed(o.getPointsUsed())
                .discountPercent(o.getDiscountPercent())
                .couponCode(o.getCouponCode())
                .status(o.getStatus().name())
                .createdAt(o.getCreatedAt())
                .expiresAt(o.getExpiresAt())
                .build();
    }

    private String generateQrDataUri(String content) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, 300, 300,
                    Map.of(EncodeHintType.MARGIN, 1));
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", baos);
            String base64 = Base64.getEncoder().encodeToString(baos.toByteArray());
            return "data:image/png;base64," + base64;
        } catch (WriterException | java.io.IOException e) {
            log.error("QR generation failed", e);
            return null;
        }
    }
}
