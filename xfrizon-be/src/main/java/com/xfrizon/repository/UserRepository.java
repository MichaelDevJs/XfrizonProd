package com.xfrizon.repository;

import com.xfrizon.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByIdAndIsActiveTrue(Long id);

    @Query(value = "SELECT u.* FROM users u " +
            "INNER JOIN user_tickets ut ON u.id = ut.user_id " +
            "INNER JOIN ticket_tiers tt ON ut.ticket_tier_id = tt.id " +
            "INNER JOIN events e ON tt.event_id = e.id " +
            "WHERE e.id = :eventId " +
            "GROUP BY u.id " +
            "ORDER BY MAX(ut.created_at) DESC " +
            "LIMIT :limit",
            nativeQuery = true)
    List<User> findRecentEventAttendees(@Param("eventId") Long eventId, @Param("limit") int limit);

    // Get users who saved the event (for interested count)
    @Query(value = "SELECT u.* FROM users u " +
            "INNER JOIN user_events ue ON u.id = ue.user_id " +
            "WHERE ue.event_id = :eventId " +
            "GROUP BY u.id " +
            "ORDER BY MAX(ue.created_at) DESC " +
            "LIMIT :limit",
            nativeQuery = true)
    List<User> findEventInterestedUsers(@Param("eventId") Long eventId, @Param("limit") int limit);

    List<User> findByRoleAndPrefersManualPayout(User.UserRole role, Boolean prefersManualPayout);

    Optional<User> findByStripeAccountId(String stripeAccountId);

        long countByRoleAndIsActiveTrue(User.UserRole role);

        long countByRoleAndVerificationStatusAndIsActiveTrue(
                        User.UserRole role,
                        User.VerificationStatus verificationStatus
        );
}
