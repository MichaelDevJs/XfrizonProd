package com.xfrizon.repository;

import com.xfrizon.entity.EventPayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventPayoutRepository extends JpaRepository<EventPayout, Long> {

    Optional<EventPayout> findByEventIdAndCurrency(Long eventId, String currency);

    List<EventPayout> findByOrganizerIdOrderByReleaseAtDesc(Long organizerId);

    List<EventPayout> findByStatusOrderByReleaseAtAsc(EventPayout.PayoutStatus status);

    @Query("""
        SELECT ep
        FROM EventPayout ep
        WHERE ep.status IN :statuses
          AND ep.releaseAt <= :now
          AND ep.adminHold = false
        ORDER BY ep.releaseAt ASC
        """)
    List<EventPayout> findEligibleForAutoRelease(
            @Param("statuses") Collection<EventPayout.PayoutStatus> statuses,
            @Param("now") LocalDateTime now
    );
}
