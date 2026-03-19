package com.xfrizon.service;

import com.xfrizon.dto.BankDetailsRequest;
import com.xfrizon.dto.BankDetailsResponse;
import com.xfrizon.entity.User;
import com.xfrizon.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
@AllArgsConstructor
public class BankDetailsService {

    private final UserRepository userRepository;

    public BankDetailsResponse saveBankDetails(Long organizerId, BankDetailsRequest request) {
        User organizer = userRepository.findById(organizerId)
                .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

        if (!organizer.getRole().equals(User.UserRole.ORGANIZER)) {
            throw new IllegalArgumentException("User is not an organizer");
        }

        if (Boolean.TRUE.equals(request.getPrefersManualPayout())) {
            boolean hasIban = request.getIban() != null && !request.getIban().isBlank();
            boolean hasAccountNumber = request.getAccountNumber() != null && !request.getAccountNumber().isBlank();

            if (!hasIban && !hasAccountNumber) {
                throw new IllegalArgumentException("For manual payouts, provide at least IBAN or account number");
            }

            if (request.getBankCountry() == null || request.getBankCountry().isBlank()) {
                throw new IllegalArgumentException("Bank country is required for manual payouts");
            }
        }

        // Update bank details
        organizer.setBankName(request.getBankName());
        organizer.setAccountHolderName(request.getAccountHolderName());
        organizer.setIban(request.getIban());
        organizer.setBicSwift(request.getBicSwift());
        organizer.setBankCountry(request.getBankCountry());
        organizer.setAccountNumber(request.getAccountNumber());
        organizer.setBankBranch(request.getBankBranch());
        
        if (request.getPrefersManualPayout() != null) {
            organizer.setPrefersManualPayout(request.getPrefersManualPayout());
        }

        // Mark as unverified when updated (admin needs to verify)
        organizer.setBankDetailsVerified(false);

        User saved = userRepository.save(organizer);
        log.info("Updated bank details for organizer {}", organizerId);

        return mapToResponse(saved);
    }

    public BankDetailsResponse getBankDetails(Long organizerId) {
        User organizer = userRepository.findById(organizerId)
                .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

        if (!organizer.getRole().equals(User.UserRole.ORGANIZER)) {
            throw new IllegalArgumentException("User is not an organizer");
        }

        return mapToResponse(organizer);
    }

    public BankDetailsResponse verifyBankDetails(Long organizerId, Boolean verified) {
        User organizer = userRepository.findById(organizerId)
                .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

        organizer.setBankDetailsVerified(verified);
        User saved = userRepository.save(organizer);
        
        log.info("Verified bank details for organizer {}: {}", organizerId, verified);
        return mapToResponse(saved);
    }

    public List<BankDetailsResponse> getOrganizersWithManualPayout() {
        List<User> organizers = userRepository.findByRoleAndPrefersManualPayout(
                User.UserRole.ORGANIZER, true);
        
        return organizers.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private BankDetailsResponse mapToResponse(User organizer) {
        return BankDetailsResponse.builder()
                .organizerId(organizer.getId())
                .organizerName(organizer.getFirstName() + " " + organizer.getLastName())
                .bankName(organizer.getBankName())
                .accountHolderName(organizer.getAccountHolderName())
                .iban(organizer.getIban())
                .bicSwift(organizer.getBicSwift())
                .bankCountry(organizer.getBankCountry())
                .accountNumber(organizer.getAccountNumber())
                .bankBranch(organizer.getBankBranch())
                .bankDetailsVerified(organizer.getBankDetailsVerified())
                .prefersManualPayout(organizer.getPrefersManualPayout())
                .build();
    }
}
