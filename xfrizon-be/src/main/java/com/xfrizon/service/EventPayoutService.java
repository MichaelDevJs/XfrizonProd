package com.xfrizon.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Transfer;
import com.xfrizon.dto.EventPayoutPreviewResponse;
import com.xfrizon.entity.Event;
import com.xfrizon.entity.EventPayout;
import com.xfrizon.entity.User;
import com.xfrizon.repository.EventPayoutRepository;
import com.xfrizon.repository.EventRepository;
import com.xfrizon.repository.PaymentRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class EventPayoutService {

    private final PaymentRecordRepository paymentRecordRepository;
    private final EventRepository eventRepository;
    private final EventPayoutRepository eventPayoutRepository;

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Scheduled(cron = "${xfrizon.payout.auto-release.cron:0 */15 * * * *}")
    public void processScheduledPayouts() {
        try {
            syncEventPayouts();
            releaseEligiblePayouts();
        } catch (Exception ex) {
            log.error("Scheduled payout job failed", ex);
        }
    }

    public List<EventPayoutPreviewResponse> getAdminPreview(String status) {
        syncEventPayouts();
        List<EventPayout> payouts;

        if (status == null || status.isBlank()) {
            payouts = eventPayoutRepository.findAll().stream()
                .sorted(
                    Comparator.comparing(
                        EventPayout::getReleaseAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                    )
                )
                .collect(Collectors.toList());
        } else {
            EventPayout.PayoutStatus resolvedStatus = EventPayout.PayoutStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            payouts = eventPayoutRepository.findByStatusOrderByReleaseAtAsc(resolvedStatus);
        }

        return payouts.stream().map(this::toPreview).collect(Collectors.toList());
    }

    public List<EventPayoutPreviewResponse> getOrganizerPreview(Long organizerId) {
        syncEventPayouts();
        return eventPayoutRepository.findByOrganizerIdOrderByReleaseAtDesc(organizerId)
            .stream()
            .map(this::toPreview)
            .collect(Collectors.toList());
    }

    public EventPayout holdPayout(Long payoutId, String reason) {
        EventPayout payout = getPayoutOrThrow(payoutId);
        if (payout.getStatus() == EventPayout.PayoutStatus.PAID) {
            throw new IllegalArgumentException("Paid payouts cannot be held");
        }

        payout.setAdminHold(true);
        payout.setHoldReason(reason != null ? reason.trim() : "Held by admin");
        payout.setStatus(EventPayout.PayoutStatus.HELD);
        return eventPayoutRepository.save(payout);
    }

    public EventPayout releaseHold(Long payoutId) {
        EventPayout payout = getPayoutOrThrow(payoutId);
        if (payout.getStatus() == EventPayout.PayoutStatus.PAID) {
            return payout;
        }

        payout.setAdminHold(false);
        payout.setHoldReason(null);
        payout.setStatus(resolveCurrentStatus(payout));
        return eventPayoutRepository.save(payout);
    }

    public EventPayout payNow(Long payoutId) {
        EventPayout payout = getPayoutOrThrow(payoutId);
        if (payout.getStatus() == EventPayout.PayoutStatus.PAID) {
            return payout;
        }

        payout.setAdminHold(false);
        payout.setHoldReason(null);
        executeStripeTransfer(payout);
        return eventPayoutRepository.save(payout);
    }

    public EventPayout completeManualPayout(Long payoutId) {
        EventPayout payout = getPayoutOrThrow(payoutId);
        if (payout.getStatus() == EventPayout.PayoutStatus.PAID) {
            return payout;
        }

        User organizer = payout.getOrganizer();
        if (organizer == null || !Boolean.TRUE.equals(organizer.getPrefersManualPayout())) {
            throw new IllegalArgumentException("Organizer is not configured for manual payouts");
        }

        payout.setAdminHold(false);
        payout.setHoldReason(null);
        payout.setFailureReason(null);
        payout.setStripeTransferId("MANUAL-" + payout.getId() + "-" + System.currentTimeMillis());
        payout.setStatus(EventPayout.PayoutStatus.PAID);
        payout.setPaidAt(LocalDateTime.now());
        return eventPayoutRepository.save(payout);
    }

    public EventPayout retryFailedPayout(Long payoutId) {
        EventPayout payout = getPayoutOrThrow(payoutId);
        if (payout.getStatus() != EventPayout.PayoutStatus.FAILED) {
            throw new IllegalArgumentException("Only failed payouts can be retried");
        }

        payout.setAdminHold(false);
        payout.setHoldReason(null);
        payout.setFailureReason(null);
        executeStripeTransfer(payout);
        return eventPayoutRepository.save(payout);
    }

    public int retryAllFailedPayouts() {
        List<EventPayout> failed = eventPayoutRepository.findByStatusOrderByReleaseAtAsc(EventPayout.PayoutStatus.FAILED);
        int retried = 0;
        for (EventPayout payout : failed) {
            if (Boolean.TRUE.equals(payout.getAdminHold())) {
                continue;
            }
            payout.setFailureReason(null);
            executeStripeTransfer(payout);
            eventPayoutRepository.save(payout);
            retried += 1;
        }
        return retried;
    }

    public void syncEventPayouts() {
        List<Object[]> rows = paymentRecordRepository.summarizeSucceededPaymentsByEventAndCurrency();

        for (Object[] row : rows) {
            try {
                Long eventId = (Long) row[0];
                Long organizerId = (Long) row[1];
                String currency = ((String) row[2]).toUpperCase(Locale.ROOT);
                BigDecimal grossRevenue = nvl((BigDecimal) row[3]);
                BigDecimal serviceFeeTotal = nvl((BigDecimal) row[4]);
                BigDecimal netPayout = nvl((BigDecimal) row[5]);
                Long successfulPaymentsCount = (Long) row[6];
                LocalDateTime lastPaymentAt = (LocalDateTime) row[7];

                Optional<Event> eventOpt = eventRepository.findById(eventId);
                if (eventOpt.isEmpty()) {
                    log.warn("Skipping payout sync for missing event {}", eventId);
                    continue;
                }

                Event event = eventOpt.get();
                User organizer = event.getOrganizer();
                if (organizer == null || !Objects.equals(organizer.getId(), organizerId)) {
                    log.warn("Skipping payout sync for event {} due to organizer mismatch", eventId);
                    continue;
                }

                LocalDateTime eventEndAt = resolveEventEndAt(event, lastPaymentAt);
                LocalDateTime releaseAt = eventEndAt.plusDays(1);

                EventPayout payout = eventPayoutRepository.findByEventIdAndCurrency(eventId, currency)
                    .orElseGet(() -> EventPayout.builder()
                        .event(event)
                        .organizer(organizer)
                        .currency(currency)
                        .adminHold(false)
                        .build());

                payout.setGrossRevenue(grossRevenue);
                payout.setServiceFeeTotal(serviceFeeTotal);
                payout.setNetPayout(netPayout);
                payout.setSuccessfulPaymentsCount(successfulPaymentsCount != null ? successfulPaymentsCount : 0L);
                payout.setLastPaymentAt(lastPaymentAt);
                payout.setEventEndAt(eventEndAt);
                payout.setReleaseAt(releaseAt);

                if (Boolean.TRUE.equals(payout.getAdminHold())) {
                    payout.setStatus(EventPayout.PayoutStatus.HELD);
                } else if (payout.getStatus() != EventPayout.PayoutStatus.PAID) {
                    payout.setStatus(resolveCurrentStatus(payout));
                }

                eventPayoutRepository.save(payout);
            } catch (Exception ex) {
                log.error("Skipping payout sync row due to error: {}", ex.getMessage(), ex);
            }
        }
    }

    private LocalDateTime resolveEventEndAt(Event event, LocalDateTime lastPaymentAt) {
        if (event.getEventEndDate() != null) {
            return event.getEventEndDate();
        }
        if (event.getEventDateTime() != null) {
            return event.getEventDateTime();
        }
        if (lastPaymentAt != null) {
            log.warn("Event {} missing event date fields; using last payment time for payout schedule", event.getId());
            return lastPaymentAt;
        }
        if (event.getCreatedAt() != null) {
            log.warn("Event {} missing event date fields and payment time; using createdAt for payout schedule", event.getId());
            return event.getCreatedAt();
        }

        log.warn("Event {} missing all schedule timestamps; using current time for payout schedule", event.getId());
        return LocalDateTime.now();
    }

    private void releaseEligiblePayouts() {
        List<EventPayout> eligible = eventPayoutRepository.findEligibleForAutoRelease(
            List.of(EventPayout.PayoutStatus.READY, EventPayout.PayoutStatus.FAILED),
            LocalDateTime.now()
        );

        for (EventPayout payout : eligible) {
            User organizer = payout.getOrganizer();
            if (organizer == null || Boolean.TRUE.equals(organizer.getPrefersManualPayout())) {
                continue;
            }

            executeStripeTransfer(payout);
            eventPayoutRepository.save(payout);
        }
    }

    private void executeStripeTransfer(EventPayout payout) {
        try {
            String destinationAccountId = payout.getOrganizer() != null ? payout.getOrganizer().getStripeAccountId() : null;
            if (destinationAccountId == null || destinationAccountId.isBlank()) {
                payout.setStatus(EventPayout.PayoutStatus.FAILED);
                payout.setFailureReason("Organizer Stripe account is not connected");
                return;
            }

            if (payout.getNetPayout() == null || payout.getNetPayout().compareTo(BigDecimal.ZERO) <= 0) {
                payout.setStatus(EventPayout.PayoutStatus.FAILED);
                payout.setFailureReason("Net payout must be greater than zero");
                return;
            }

            Stripe.apiKey = stripeApiKey;

            long amountInMinor = payout.getNetPayout()
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();

            Map<String, Object> params = new HashMap<>();
            params.put("amount", amountInMinor);
            params.put("currency", payout.getCurrency().toLowerCase(Locale.ROOT));
            params.put("destination", destinationAccountId);
            params.put("description", "Xfrizon payout for event #" + payout.getEvent().getId());

            Map<String, String> metadata = new HashMap<>();
            metadata.put("event_id", String.valueOf(payout.getEvent().getId()));
            metadata.put("organizer_id", String.valueOf(payout.getOrganizer().getId()));
            params.put("metadata", metadata);

            Transfer transfer = Transfer.create(params);

            payout.setStripeTransferId(transfer.getId());
            payout.setStatus(EventPayout.PayoutStatus.PAID);
            payout.setPaidAt(LocalDateTime.now());
            payout.setFailureReason(null);
        } catch (StripeException ex) {
            payout.setStatus(EventPayout.PayoutStatus.FAILED);
            payout.setFailureReason(ex.getMessage());
            log.error("Failed to transfer payout {}", payout.getId(), ex);
        }
    }

    private EventPayout.PayoutStatus resolveCurrentStatus(EventPayout payout) {
        LocalDateTime now = LocalDateTime.now();
        if (Boolean.TRUE.equals(payout.getAdminHold())) {
            return EventPayout.PayoutStatus.HELD;
        }
        if (payout.getReleaseAt() != null && now.isBefore(payout.getReleaseAt())) {
            return EventPayout.PayoutStatus.SCHEDULED;
        }
        return EventPayout.PayoutStatus.READY;
    }

    private EventPayoutPreviewResponse toPreview(EventPayout payout) {
        User organizer = payout.getOrganizer();
        Event event = payout.getEvent();
        boolean hasStripeAccount = organizer != null
            && organizer.getStripeAccountId() != null
            && !organizer.getStripeAccountId().isBlank()
            && !Boolean.TRUE.equals(organizer.getPrefersManualPayout());
        boolean prefersManualPayout = organizer != null && Boolean.TRUE.equals(organizer.getPrefersManualPayout());

        return EventPayoutPreviewResponse.builder()
            .payoutId(payout.getId())
            .eventId(event != null ? event.getId() : null)
            .eventTitle(event != null ? event.getTitle() : "-")
            .organizerId(organizer != null ? organizer.getId() : null)
            .organizerName(resolveOrganizerName(organizer))
            .organizerEmail(organizer != null ? organizer.getEmail() : "")
            .currency(payout.getCurrency())
            .grossRevenue(nvl(payout.getGrossRevenue()))
            .serviceFeeTotal(nvl(payout.getServiceFeeTotal()))
            .netPayout(nvl(payout.getNetPayout()))
            .successfulPaymentsCount(payout.getSuccessfulPaymentsCount())
            .lastPaymentAt(payout.getLastPaymentAt())
            .eventEndAt(payout.getEventEndAt())
            .releaseAt(payout.getReleaseAt())
            .status(payout.getStatus().name())
            .adminHold(Boolean.TRUE.equals(payout.getAdminHold()))
            .holdReason(payout.getHoldReason())
            .stripeTransferId(payout.getStripeTransferId())
            .failureReason(payout.getFailureReason())
            .paidAt(payout.getPaidAt())
            .readyForAutoPayout(hasStripeAccount && payout.getStatus() == EventPayout.PayoutStatus.READY)
                .prefersManualPayout(prefersManualPayout)
                .bankName(organizer != null ? organizer.getBankName() : null)
                .accountHolderName(organizer != null ? organizer.getAccountHolderName() : null)
                .accountNumber(organizer != null ? organizer.getAccountNumber() : null)
                .iban(organizer != null ? organizer.getIban() : null)
                .bankCountry(organizer != null ? organizer.getBankCountry() : null)
            .build();
    }

    private String resolveOrganizerName(User organizer) {
        if (organizer == null) {
            return "Unknown Organizer";
        }
        if (organizer.getName() != null && !organizer.getName().isBlank()) {
            return organizer.getName();
        }
        String first = organizer.getFirstName() != null ? organizer.getFirstName() : "";
        String last = organizer.getLastName() != null ? organizer.getLastName() : "";
        String fullName = (first + " " + last).trim();
        return fullName.isBlank() ? "Unknown Organizer" : fullName;
    }

    private EventPayout getPayoutOrThrow(Long payoutId) {
        return eventPayoutRepository.findById(payoutId)
            .orElseThrow(() -> new IllegalArgumentException("Event payout not found"));
    }

    private BigDecimal nvl(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
