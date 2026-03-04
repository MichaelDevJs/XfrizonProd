package com.xfrizon.repository;

import com.xfrizon.entity.PaymentRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {

    Optional<PaymentRecord> findByStripeIntentId(String stripeIntentId);

    Page<PaymentRecord> findByUserId(Long userId, Pageable pageable);

    List<PaymentRecord> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<PaymentRecord> findByEventId(Long eventId, Pageable pageable);

    Page<PaymentRecord> findByStatus(PaymentRecord.PaymentStatus status, Pageable pageable);

    @Query("SELECT COALESCE(SUM(pr.amount), 0) FROM PaymentRecord pr WHERE pr.event.id = ?1 AND pr.status = 'SUCCEEDED'")
    BigDecimal getTotalRevenueByEvent(Long eventId);

    @Query("SELECT COALESCE(SUM(pr.amount), 0) FROM PaymentRecord pr WHERE pr.user.id = ?1 AND pr.status = 'SUCCEEDED'")
    BigDecimal getTotalPaidByUser(Long userId);

    @Query("SELECT COUNT(pr) FROM PaymentRecord pr WHERE pr.event.id = ?1 AND pr.status = 'SUCCEEDED'")
    Long countSuccessfulPaymentsByEvent(Long eventId);

    @Query("SELECT COUNT(DISTINCT pr.user.id) FROM PaymentRecord pr WHERE pr.event.id = ?1 AND pr.status = 'SUCCEEDED'")
    Long countUniquePayersByEvent(Long eventId);

    @Query("SELECT pr FROM PaymentRecord pr WHERE pr.createdAt BETWEEN ?1 AND ?2 AND pr.status = 'SUCCEEDED'")
    List<PaymentRecord> findPaymentsBetweenDates(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT pr FROM PaymentRecord pr WHERE pr.user.id = ?1 AND pr.event.id = ?2 ORDER BY pr.createdAt DESC")
    List<PaymentRecord> findUserEventPayments(Long userId, Long eventId);

    @Query("SELECT pr FROM PaymentRecord pr WHERE pr.event.organizer.id = ?1 AND pr.createdAt BETWEEN ?2 AND ?3 AND pr.status = 'SUCCEEDED' ORDER BY pr.createdAt DESC")
    List<PaymentRecord> findPaymentsByOrganizerWithinDateRange(Long organizerId, LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT pr FROM PaymentRecord pr WHERE pr.event.organizer.id = ?1 AND pr.status = 'SUCCEEDED' ORDER BY pr.createdAt DESC")
    List<PaymentRecord> findAllPaymentsByOrganizer(Long organizerId);

    @Query("""
        SELECT
            pr.event.organizer.id,
            pr.currency,
            COALESCE(SUM(pr.amount), 0),
            COALESCE(SUM(pr.serviceFeeAmount), 0),
            COALESCE(SUM(pr.organizerAmount), 0),
            COUNT(pr),
            MAX(pr.createdAt)
        FROM PaymentRecord pr
        WHERE pr.status = 'SUCCEEDED'
        GROUP BY pr.event.organizer.id, pr.currency
        """)
    List<Object[]> summarizeSucceededPaymentsByOrganizerAndCurrency();

    @Query("""
        SELECT
            pr.event.organizer.id,
            pr.currency,
            COALESCE(SUM(pr.amount), 0),
            COALESCE(SUM(pr.serviceFeeAmount), 0),
            COALESCE(SUM(pr.organizerAmount), 0),
            COUNT(pr),
            MAX(pr.createdAt)
        FROM PaymentRecord pr
        WHERE pr.status = 'SUCCEEDED'
          AND (:fromDate IS NULL OR pr.createdAt >= :fromDate)
          AND (:toDate IS NULL OR pr.createdAt <= :toDate)
        GROUP BY pr.event.organizer.id, pr.currency
        """)
    List<Object[]> summarizeSucceededPaymentsByOrganizerAndCurrencyWithinRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );
}
