package com.xfrizon.service;

import com.xfrizon.dto.AdminUserManagementRow;
import com.xfrizon.entity.User;
import com.xfrizon.repository.PaymentRecordRepository;
import com.xfrizon.repository.UserRepository;
import com.xfrizon.repository.UserTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserTicketRepository userTicketRepository;
    private final PaymentRecordRepository paymentRecordRepository;

    public List<AdminUserManagementRow> getAdminUserManagementRows() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toRow)
                .collect(Collectors.toList());
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
