package com.xfrizon.service;

import com.xfrizon.entity.Event;
import com.xfrizon.entity.ReferralConversion;
import com.xfrizon.entity.User;
import com.xfrizon.repository.ReferralConversionRepository;
import com.xfrizon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReferralConversionService {

    private final UserRepository userRepository;
    private final ReferralConversionRepository referralConversionRepository;

    @Transactional
    public void trackSignupConversion(String referralCode, User referredUser) {
        if (referredUser == null || isBlank(referralCode)) {
            return;
        }

        Optional<User> referrerOpt = resolveReferrer(referralCode);
        if (referrerOpt.isEmpty()) {
            return;
        }

        User referrer = referrerOpt.get();
        if (referrer.getId().equals(referredUser.getId())) {
            return;
        }

        boolean alreadyTracked = referralConversionRepository.existsByConversionTypeAndReferredUser_Id(
                ReferralConversion.ConversionType.SIGNUP,
                referredUser.getId()
        );
        if (alreadyTracked) {
            return;
        }

        ReferralConversion conversion = ReferralConversion.builder()
                .referrerUser(referrer)
                .referredUser(referredUser)
                .conversionType(ReferralConversion.ConversionType.SIGNUP)
                .referralCode(referralCode.trim())
                .build();

        referralConversionRepository.save(conversion);
    }

    @Transactional
    public void trackTicketPurchaseConversion(String referralCode, User purchaser, Event event, String paymentIntentId) {
        if (purchaser == null || isBlank(referralCode) || isBlank(paymentIntentId)) {
            return;
        }

        Optional<User> referrerOpt = resolveReferrer(referralCode);
        if (referrerOpt.isEmpty()) {
            return;
        }

        User referrer = referrerOpt.get();
        if (referrer.getId().equals(purchaser.getId())) {
            return;
        }

        boolean alreadyTracked = referralConversionRepository.existsByConversionTypeAndPaymentIntentId(
                ReferralConversion.ConversionType.TICKET_PURCHASE,
                paymentIntentId.trim()
        );
        if (alreadyTracked) {
            return;
        }

        ReferralConversion conversion = ReferralConversion.builder()
                .referrerUser(referrer)
                .referredUser(purchaser)
                .conversionType(ReferralConversion.ConversionType.TICKET_PURCHASE)
                .referralCode(referralCode.trim())
                .eventId(event != null ? event.getId() : null)
                .paymentIntentId(paymentIntentId.trim())
                .build();

        referralConversionRepository.save(conversion);
    }

    private Optional<User> resolveReferrer(String referralCode) {
        if (isBlank(referralCode)) {
            return Optional.empty();
        }

        try {
            Long referrerId = Long.parseLong(referralCode.trim());
            return userRepository.findById(referrerId);
        } catch (NumberFormatException ex) {
            log.debug("Skipping non-numeric referral code: {}", referralCode);
            return Optional.empty();
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}