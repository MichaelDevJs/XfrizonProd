package com.xfrizon.service;

import com.xfrizon.dto.AdminUserManagementRow;
import com.xfrizon.entity.User;
import com.xfrizon.repository.EmailVerificationTokenRepository;
import com.xfrizon.repository.PaymentRecordRepository;
import com.xfrizon.repository.PointsTransactionRepository;
import com.xfrizon.repository.PointsWalletRepository;
import com.xfrizon.repository.ReferralConversionRepository;
import com.xfrizon.repository.UserEventRepository;
import com.xfrizon.repository.UserRepository;
import com.xfrizon.repository.UserTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserTicketRepository userTicketRepository;
    private final UserEventRepository userEventRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final PointsWalletRepository pointsWalletRepository;
    private final PointsTransactionRepository pointsTransactionRepository;
    private final ReferralConversionRepository referralConversionRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    public List<AdminUserManagementRow> getAdminUserManagementRows() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toRow)
                .collect(Collectors.toList());
    }

    public User assignRole(Long userId, String requestedRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String normalizedRole = requestedRole == null ? "" : requestedRole.trim().toUpperCase(Locale.ROOT);
        if (normalizedRole.isBlank()) {
            throw new IllegalArgumentException("Role is required");
        }

        switch (normalizedRole) {
            case "ADMIN" -> {
                user.setRole(User.UserRole.ADMIN);
                user.setRoles("ADMIN");
            }
            case "ORGANIZER" -> {
                user.setRole(User.UserRole.ORGANIZER);
                user.setRoles("ORGANIZER");
            }
            case "BLOG_WRITER" -> {
                user.setRole(User.UserRole.USER);
                user.setRoles("USER,BLOG_WRITER");
            }
            case "USER" -> {
                user.setRole(User.UserRole.USER);
                user.setRoles("USER");
            }
            default -> throw new IllegalArgumentException("Unsupported role: " + normalizedRole);
        }

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Clean dependent records first to avoid FK constraint violations.
        emailVerificationTokenRepository.deleteByUser_Id(userId);
        emailVerificationTokenRepository.deleteByEmailAndIsUsedFalse(user.getEmail());
        referralConversionRepository.deleteByReferredUser_Id(userId);
        referralConversionRepository.deleteByReferrerUser_Id(userId);
        pointsTransactionRepository.deleteByUserId(userId);
        pointsWalletRepository.deleteByUserId(userId);
        userEventRepository.deleteByUserId(userId);
        userTicketRepository.deleteByUserId(userId);
        paymentRecordRepository.deleteByUserId(userId);
        userRepository.deleteById(userId);
    }

    private AdminUserManagementRow toRow(User user) {
        String displayName = String.format("%s %s",
                safeText(user.getFirstName()),
                safeText(user.getLastName())).trim();

        if (displayName.isBlank()) {
            displayName = safeText(user.getName());
        }

        Integer ticketsBought = userTicketRepository.sumPurchasedQuantityByUserId(user.getId());
        BigDecimal amountSpent = paymentRecordRepository.getTotalPaidByUser(user.getId());
        String primaryRole = user.getRole() == null ? "N/A" : user.getRole().name();
        String mergedRoles = safeRoles(user.getRoles(), primaryRole);

        return AdminUserManagementRow.builder()
                .userId(user.getId())
                .name(displayName.isBlank() ? "N/A" : displayName)
                .email(safeText(user.getEmail()))
                .role(primaryRole)
                .roles(mergedRoles)
                .location(safeText(user.getLocation()))
                .ticketsBought(ticketsBought == null ? 0 : ticketsBought)
                .amountSpent(amountSpent == null ? BigDecimal.ZERO : amountSpent)
                .phoneNumber(safeText(user.getPhoneNumber()))
                .address(safeText(user.getAddress()))
                .website(safeText(user.getWebsite()))
                .instagram(safeText(user.getInstagram()))
                .twitter(safeText(user.getTwitter()))
                .bio(safeText(user.getBio()))
                .dateJoined(user.getCreatedAt())
                .build();
    }

    private String safeRoles(String roles, String fallbackRole) {
        if (roles != null && !roles.isBlank()) {
            return roles;
        }
        return safeText(fallbackRole);
    }

    private String safeText(String value) {
        return value == null || value.isBlank() ? "N/A" : value;
    }

}
