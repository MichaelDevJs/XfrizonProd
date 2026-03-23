package com.xfrizon.repository;

import com.xfrizon.entity.ReferralConversion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReferralConversionRepository extends JpaRepository<ReferralConversion, Long> {

    long deleteByReferredUser_Id(Long userId);

    long deleteByReferrerUser_Id(Long userId);

    boolean existsByConversionTypeAndReferredUser_Id(ReferralConversion.ConversionType conversionType, Long referredUserId);

    boolean existsByConversionTypeAndPaymentIntentId(ReferralConversion.ConversionType conversionType, String paymentIntentId);

    long countByConversionTypeAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
        ReferralConversion.ConversionType conversionType,
        LocalDateTime from,
        LocalDateTime toExclusive
    );

    @Query(value = "SELECT COUNT(DISTINCT rc.referrer_user_id) " +
        "FROM referral_conversions rc " +
        "WHERE rc.created_at >= :from AND rc.created_at < :toExclusive",
        nativeQuery = true)
    long countDistinctReferrersBetween(
        @Param("from") LocalDateTime from,
        @Param("toExclusive") LocalDateTime toExclusive
    );

    @Query(value = "SELECT rc.referrer_user_id, u.first_name, u.last_name, u.email, " +
        "SUM(CASE WHEN rc.conversion_type = 'SIGNUP' THEN 1 ELSE 0 END) AS signup_count, " +
        "SUM(CASE WHEN rc.conversion_type = 'TICKET_PURCHASE' THEN 1 ELSE 0 END) AS purchase_count, " +
        "COUNT(*) AS total_count " +
        "FROM referral_conversions rc " +
        "INNER JOIN users u ON u.id = rc.referrer_user_id " +
        "WHERE rc.created_at >= :from AND rc.created_at < :toExclusive " +
        "GROUP BY rc.referrer_user_id, u.first_name, u.last_name, u.email " +
        "ORDER BY total_count DESC " +
        "LIMIT :limit",
        nativeQuery = true)
    List<Object[]> findTopReferrersBetween(
        @Param("from") LocalDateTime from,
        @Param("toExclusive") LocalDateTime toExclusive,
        @Param("limit") int limit
    );
}