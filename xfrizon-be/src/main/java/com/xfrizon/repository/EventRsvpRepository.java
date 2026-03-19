package com.xfrizon.repository;

import com.xfrizon.entity.EventRsvp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRsvpRepository extends JpaRepository<EventRsvp, Long> {
    List<EventRsvp> findByEventIdOrderByCreatedAtDesc(Long eventId);

    Optional<EventRsvp> findByEventIdAndEmailIgnoreCase(Long eventId, String email);

    Optional<EventRsvp> findByEventIdAndUserId(Long eventId, Long userId);

    int countByEventIdAndStatus(Long eventId, EventRsvp.RsvpStatus status);
}
