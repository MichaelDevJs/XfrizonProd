package com.xfrizon.service;

import com.xfrizon.dto.AdminDashboardSummaryResponse;
import com.xfrizon.entity.User;
import com.xfrizon.repository.BlogRepository;
import com.xfrizon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final BlogRepository blogRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public AdminDashboardSummaryResponse getSummary() {
        long totalBlogs = blogRepository.countActiveBlogs();
        long totalUsers = userRepository.countByRoleAndIsActiveTrue(User.UserRole.USER);
        long totalOrganizers = userRepository.countByRoleAndIsActiveTrue(User.UserRole.ORGANIZER);
        long verifiedOrganizers = userRepository.countByRoleAndVerificationStatusAndIsActiveTrue(
                User.UserRole.ORGANIZER,
                User.VerificationStatus.ADMIN_APPROVED
        );
        long pendingVerification = userRepository.countByRoleAndVerificationStatusAndIsActiveTrue(
                User.UserRole.ORGANIZER,
                User.VerificationStatus.PENDING
        );

        return AdminDashboardSummaryResponse.builder()
                .totalBlogs(totalBlogs)
                .totalUsers(totalUsers)
                .totalOrganizers(totalOrganizers)
                .verifiedOrganizers(verifiedOrganizers)
                .pendingVerification(pendingVerification)
                .unreadMessages(null)
                .build();
    }
}