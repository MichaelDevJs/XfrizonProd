package com.xfrizon.repository;

import com.xfrizon.entity.ManualPayout;
import com.xfrizon.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ManualPayoutRepository extends JpaRepository<ManualPayout, Long> {
    Page<ManualPayout> findByOrganizer(User organizer, Pageable pageable);
    Page<ManualPayout> findByStatus(ManualPayout.PayoutStatus status, Pageable pageable);
    List<ManualPayout> findByStatus(ManualPayout.PayoutStatus status);
    List<ManualPayout> findByOrganizerAndStatus(User organizer, ManualPayout.PayoutStatus status);

        @Query("""
                SELECT COALESCE(SUM(mp.amount), 0)
                FROM ManualPayout mp
                WHERE mp.organizer.id = :organizerId
                    AND mp.status = :status
                    AND mp.currency = :currency
                """)
        BigDecimal sumAmountByOrganizerAndStatusAndCurrency(
                        @Param("organizerId") Long organizerId,
                        @Param("status") ManualPayout.PayoutStatus status,
                        @Param("currency") String currency
        );
}
