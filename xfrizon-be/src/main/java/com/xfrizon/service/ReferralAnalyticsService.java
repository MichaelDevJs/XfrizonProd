package com.xfrizon.service;

import com.xfrizon.dto.ReferralAnalyticsResponse;
import com.xfrizon.entity.ReferralConversion;
import com.xfrizon.repository.ReferralConversionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReferralAnalyticsService {

    private final ReferralConversionRepository referralConversionRepository;

    @Transactional(readOnly = true)
    public ReferralAnalyticsResponse getAnalytics(LocalDate fromDate, LocalDate toDate, int limit) {
        LocalDate resolvedFrom = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate resolvedTo = toDate != null ? toDate : LocalDate.now();

        if (resolvedTo.isBefore(resolvedFrom)) {
            throw new IllegalArgumentException("toDate cannot be earlier than fromDate");
        }

        int resolvedLimit = Math.max(1, Math.min(limit, 100));

        LocalDateTime from = resolvedFrom.atStartOfDay();
        LocalDateTime toExclusive = resolvedTo.plusDays(1).atStartOfDay();

        long signupCount = referralConversionRepository.countByConversionTypeAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                ReferralConversion.ConversionType.SIGNUP,
                from,
                toExclusive
        );
        long purchaseCount = referralConversionRepository.countByConversionTypeAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                ReferralConversion.ConversionType.TICKET_PURCHASE,
                from,
                toExclusive
        );
        long uniqueReferrers = referralConversionRepository.countDistinctReferrersBetween(from, toExclusive);

        List<ReferralAnalyticsResponse.ReferrerStats> topReferrers = referralConversionRepository
                .findTopReferrersBetween(from, toExclusive, resolvedLimit)
                .stream()
                .map(this::toReferrerStats)
                .toList();

        return ReferralAnalyticsResponse.builder()
                .fromDate(resolvedFrom)
                .toDate(resolvedTo)
                .totalSignups(signupCount)
                .totalTicketPurchases(purchaseCount)
                .totalConversions(signupCount + purchaseCount)
                .uniqueReferrers(uniqueReferrers)
                .topReferrers(topReferrers)
                .build();
    }

    private ReferralAnalyticsResponse.ReferrerStats toReferrerStats(Object[] row) {
        Long referrerUserId = row[0] != null ? ((Number) row[0]).longValue() : null;
        String firstName = row[1] != null ? String.valueOf(row[1]) : "";
        String lastName = row[2] != null ? String.valueOf(row[2]) : "";
        String fullName = (firstName + " " + lastName).trim();
        String email = row[3] != null ? String.valueOf(row[3]) : null;
        long signupCount = row[4] != null ? ((Number) row[4]).longValue() : 0L;
        long purchaseCount = row[5] != null ? ((Number) row[5]).longValue() : 0L;
        long totalCount = row[6] != null ? ((Number) row[6]).longValue() : 0L;

        return ReferralAnalyticsResponse.ReferrerStats.builder()
                .referrerUserId(referrerUserId)
                .referrerName(fullName.isEmpty() ? "Unknown" : fullName)
                .referrerEmail(email)
                .signupConversions(signupCount)
                .ticketPurchaseConversions(purchaseCount)
                .totalConversions(totalCount)
                .build();
    }
}