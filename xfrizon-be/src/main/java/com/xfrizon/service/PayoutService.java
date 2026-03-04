package com.xfrizon.service;

import com.xfrizon.dto.ManualPayoutRequest;
import com.xfrizon.dto.ManualPayoutResponse;
import com.xfrizon.dto.OrganizerPayoutPreviewResponse;
import com.xfrizon.entity.ManualPayout;
import com.xfrizon.entity.PaymentRecord;
import com.xfrizon.entity.User;
import com.xfrizon.repository.ManualPayoutRepository;
import com.xfrizon.repository.PaymentRecordRepository;
import com.xfrizon.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.time.temporal.TemporalAdjusters;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
@AllArgsConstructor
public class PayoutService {

    private final ManualPayoutRepository manualPayoutRepository;
    private final UserRepository userRepository;
    private final PaymentRecordRepository paymentRecordRepository;

    /**
     * Create a manual payout (non-Stripe) for an organizer
     * Called by admin to initiate transfer outside of Stripe
     */
    public ManualPayout createManualPayout(ManualPayoutRequest request) {
        try {
            if (request == null) {
                throw new IllegalArgumentException("Payout request is required");
            }

            User organizer = userRepository.findById(request.getOrganizerId())
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            if (organizer.getIsActive() != null && !organizer.getIsActive()) {
                throw new IllegalArgumentException("Organizer account is inactive");
            }

            if (organizer.getRole() == null || !organizer.getRole().equals(User.UserRole.ORGANIZER)) {
                throw new IllegalArgumentException("User is not an organizer");
            }

            if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Amount must be greater than zero");
            }

            if (request.getDescription() == null || request.getDescription().isBlank()) {
                throw new IllegalArgumentException("Description is required");
            }
            String normalizedDescription = request.getDescription().trim();

            if (request.getOrganizerId() == null) {
                throw new IllegalArgumentException("Organizer ID is required");
            }

                String resolvedCurrency = request.getCurrency() != null
                    ? request.getCurrency().trim().toUpperCase()
                    : "USD";
                if (resolvedCurrency.isBlank()) {
                resolvedCurrency = "USD";
                }
                if (resolvedCurrency.length() != 3) {
                    throw new IllegalArgumentException("Currency must be a 3-letter ISO code");
                }
                if (!resolvedCurrency.matches("[A-Z]{3}")) {
                    throw new IllegalArgumentException("Currency must contain only letters");
                }

                ManualPayout payout = ManualPayout.builder()
                    .organizer(organizer)
                    .amount(request.getAmount())
                    .currency(resolvedCurrency)
                        .description(normalizedDescription)
                        .bankDetails(request.getBankDetails() != null ? request.getBankDetails().trim() : null)
                    .status(ManualPayout.PayoutStatus.PENDING)
                    .build();

            ManualPayout saved = manualPayoutRepository.save(payout);
            log.info("Created manual payout {} for organizer {} (amount: {})", 
                    saved.getId(), organizer.getId(), request.getAmount());

            return saved;

        } catch (IllegalArgumentException e) {
            log.error("Validation error creating manual payout", e);
            throw e;
        } catch (Exception e) {
            log.error("Error creating manual payout", e);
            throw new RuntimeException("Failed to create manual payout: " + e.getMessage());
        }
    }

    /**
     * Mark a manual payout as sent by admin
     */
    public ManualPayout markPayoutAsSent(Long payoutId, String adminNotes) {
        try {
            ManualPayout payout = manualPayoutRepository.findById(payoutId)
                    .orElseThrow(() -> new IllegalArgumentException("Payout not found"));

            if (!payout.getStatus().equals(ManualPayout.PayoutStatus.PENDING)) {
                throw new IllegalArgumentException("Only pending payouts can be marked as sent");
            }

            payout.setStatus(ManualPayout.PayoutStatus.SENT);
            payout.setProcessedAt(LocalDateTime.now());
            payout.setAdminNotes(adminNotes);

            ManualPayout updated = manualPayoutRepository.save(payout);
            log.info("Marked payout {} as sent for organizer {}", payoutId, payout.getOrganizer().getId());

            return updated;

        } catch (Exception e) {
            log.error("Error marking payout as sent", e);
            throw new RuntimeException("Failed to mark payout as sent: " + e.getMessage());
        }
    }

    /**
     * Get all pending payouts for admin dashboard
     */
    public Page<ManualPayout> getPendingPayouts(Pageable pageable) {
        return manualPayoutRepository.findByStatus(ManualPayout.PayoutStatus.PENDING, pageable);
    }

    /**
     * Get all payouts for an organizer
     */
    public Page<ManualPayout> getOrganizerPayouts(Long organizerId, Pageable pageable) {
        try {
            User organizer = userRepository.findById(organizerId)
                    .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

            return manualPayoutRepository.findByOrganizer(organizer, pageable);

        } catch (Exception e) {
            log.error("Error fetching organizer payouts", e);
            throw new RuntimeException("Failed to fetch payouts: " + e.getMessage());
        }
    }

    /**
     * Cancel a pending payout
     */
    public ManualPayout cancelPayout(Long payoutId, String reason) {
        try {
            ManualPayout payout = manualPayoutRepository.findById(payoutId)
                    .orElseThrow(() -> new IllegalArgumentException("Payout not found"));

            if (!payout.getStatus().equals(ManualPayout.PayoutStatus.PENDING)) {
                throw new IllegalArgumentException("Only pending payouts can be cancelled");
            }

            payout.setStatus(ManualPayout.PayoutStatus.CANCELLED);
            payout.setAdminNotes(reason);

            ManualPayout updated = manualPayoutRepository.save(payout);
            log.info("Cancelled payout {} for organizer {}", payoutId, payout.getOrganizer().getId());

            return updated;

        } catch (Exception e) {
            log.error("Error cancelling payout", e);
            throw new RuntimeException("Failed to cancel payout: " + e.getMessage());
        }
    }

    /**
     * Get all pending payouts with bank details for admin
     */
    public List<ManualPayoutResponse> getPendingPayoutsWithDetails() {
        List<ManualPayout> payouts = manualPayoutRepository.findByStatus(
                ManualPayout.PayoutStatus.PENDING);
        
        return payouts.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get organizer payout previews to know how much to send manually.
     * availableToSend = totalEarnedByOrganizer - alreadySentAmount - pendingManualAmount
     */
    @Transactional(readOnly = true)
    public List<OrganizerPayoutPreviewResponse> getOrganizerPayoutPreviews() {
        return getOrganizerPayoutPreviews("WEEKLY", null, null);
        }

        @Transactional(readOnly = true)
        public List<OrganizerPayoutPreviewResponse> getOrganizerPayoutPreviews(
            String cadence,
            LocalDateTime from,
            LocalDateTime to
        ) {
        String resolvedCadence = resolveCadence(cadence);
        LocalDateTime[] resolvedRange = resolvePreviewRange(resolvedCadence, from, to);
        LocalDateTime windowStart = resolvedRange[0];
        LocalDateTime windowEnd = resolvedRange[1];

        List<Object[]> paymentSummaries = paymentRecordRepository
            .summarizeSucceededPaymentsByOrganizerAndCurrencyWithinRange(windowStart, windowEnd);

        return paymentSummaries.stream()
            .map(row -> mapToPreview(row, resolvedCadence, windowStart, windowEnd))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(OrganizerPayoutPreviewResponse::getAvailableToSend).reversed())
                .collect(Collectors.toList());
    }

        private OrganizerPayoutPreviewResponse mapToPreview(
            Object[] row,
            String cadence,
            LocalDateTime windowStart,
            LocalDateTime windowEnd
        ) {
        Long organizerId = (Long) row[0];
        String currency = ((String) row[1]).toUpperCase();
        BigDecimal grossRevenue = (BigDecimal) row[2];
        BigDecimal serviceFeeTotal = (BigDecimal) row[3];
        BigDecimal totalEarnedByOrganizer = (BigDecimal) row[4];
        Long successfulPaymentsCount = (Long) row[5];
        LocalDateTime lastPaymentAt = (LocalDateTime) row[6];

        User organizer = userRepository.findById(organizerId).orElse(null);
        if (organizer == null) {
            return null;
        }

        BigDecimal alreadySentAmount = manualPayoutRepository.sumAmountByOrganizerAndStatusAndCurrency(
                organizerId,
                ManualPayout.PayoutStatus.SENT,
                currency
        );

        BigDecimal pendingManualAmount = manualPayoutRepository.sumAmountByOrganizerAndStatusAndCurrency(
                organizerId,
                ManualPayout.PayoutStatus.PENDING,
                currency
        );

        BigDecimal availableToSend = totalEarnedByOrganizer
                .subtract(alreadySentAmount)
                .subtract(pendingManualAmount);

        return OrganizerPayoutPreviewResponse.builder()
                .organizerId(organizerId)
                .organizerName(resolveOrganizerName(organizer))
                .organizerEmail(organizer.getEmail())
            .cadence(cadence)
            .windowStart(windowStart)
            .windowEnd(windowEnd)
                .currency(currency)
                .grossRevenue(grossRevenue)
                .serviceFeeTotal(serviceFeeTotal)
                .totalEarnedByOrganizer(totalEarnedByOrganizer)
                .alreadySentAmount(alreadySentAmount)
                .pendingManualAmount(pendingManualAmount)
                .availableToSend(availableToSend)
                .successfulPaymentsCount(successfulPaymentsCount)
                .lastPaymentAt(lastPaymentAt)
                .build();
    }

    private String resolveCadence(String cadence) {
        if (cadence == null || cadence.isBlank()) {
            return "WEEKLY";
        }

        String resolved = cadence.trim().toUpperCase();
        if (!resolved.equals("WEEKLY") && !resolved.equals("MONTHLY")) {
            throw new IllegalArgumentException("Cadence must be WEEKLY or MONTHLY");
        }

        return resolved;
    }

    private LocalDateTime[] resolvePreviewRange(String cadence, LocalDateTime from, LocalDateTime to) {
        if (from != null && to != null) {
            if (from.isAfter(to)) {
                throw new IllegalArgumentException("'from' must be before or equal to 'to'");
            }
            return new LocalDateTime[]{from, to};
        }

        LocalDateTime now = LocalDateTime.now().withNano(0);

        if (cadence.equals("MONTHLY")) {
            LocalDateTime start = now.withDayOfMonth(1)
                    .withHour(0)
                    .withMinute(0)
                    .withSecond(0);
            LocalDateTime end = start.plusMonths(1).minusSeconds(1);
            return new LocalDateTime[]{start, end};
        }

        LocalDateTime start = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .withHour(0)
                .withMinute(0)
                .withSecond(0);
        LocalDateTime end = start.plusDays(6)
                .withHour(23)
                .withMinute(59)
                .withSecond(59);
        return new LocalDateTime[]{start, end};
    }

    private String resolveOrganizerName(User organizer) {
        if (organizer.getName() != null && !organizer.getName().isBlank()) {
            return organizer.getName();
        }

        String first = organizer.getFirstName() != null ? organizer.getFirstName().trim() : "";
        String last = organizer.getLastName() != null ? organizer.getLastName().trim() : "";
        String fullName = (first + " " + last).trim();

        return fullName.isBlank() ? "Unknown Organizer" : fullName;
    }

    private ManualPayoutResponse mapToResponse(ManualPayout payout) {
        User organizer = payout.getOrganizer();
        return ManualPayoutResponse.builder()
                .id(payout.getId())
                .organizerId(organizer.getId())
                .organizerName(organizer.getFirstName() + " " + organizer.getLastName())
                .organizerEmail(organizer.getEmail())
                .amount(payout.getAmount())
                .description(payout.getDescription())
                .bankDetails(payout.getBankDetails())
                .status(payout.getStatus().toString())
                .createdAt(payout.getCreatedAt())
                .processedAt(payout.getProcessedAt())
                .adminNotes(payout.getAdminNotes())
                .bankName(organizer.getBankName())
                .accountHolderName(organizer.getAccountHolderName())
                .iban(organizer.getIban())
                .bicSwift(organizer.getBicSwift())
                .bankCountry(organizer.getBankCountry())
                .accountNumber(organizer.getAccountNumber())
                .build();
    }
}
