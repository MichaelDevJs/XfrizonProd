package com.xfrizon.repository;

import com.xfrizon.entity.TicketTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketTierRepository extends JpaRepository<TicketTier, Long> {

    List<TicketTier> findByEventIdOrderByDisplayOrder(Long eventId);

    List<TicketTier> findByEventIdAndStatus(Long eventId, TicketTier.TicketStatus status);

    Optional<TicketTier> findByIdAndEventId(Long ticketId, Long eventId);

    @Query("SELECT t FROM TicketTier t WHERE t.event.id = :eventId AND t.status = 'ACTIVE' AND (t.saleEndsAt IS NULL OR t.saleEndsAt > CURRENT_TIMESTAMP)")
    List<TicketTier> findAvailableTicketsByEvent(@Param("eventId") Long eventId);

    int countByEventId(Long eventId);
}
