package com.xfrizon.repository;

import com.xfrizon.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    Page<Event> findByOrganizerId(Long organizerId, Pageable pageable);

    List<Event> findByOrganizerIdAndStatus(Long organizerId, Event.EventStatus status);

    Optional<Event> findByIdAndOrganizerId(Long eventId, Long organizerId);

    Page<Event> findByStatusAndEventDateTimeAfter(Event.EventStatus status, LocalDateTime dateTime, Pageable pageable);

    List<Event> findByStatus(Event.EventStatus status);

    Page<Event> findByStatusAndEventDateTimeGreaterThan(Event.EventStatus status, LocalDateTime dateTime, Pageable pageable);

    Page<Event> findByStatusAndCountry(Event.EventStatus status, String country, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.organizer.id = :organizerId AND e.status IN ('PUBLISHED', 'LIVE', 'COMPLETED')")
    List<Event> findPublishedEventsByOrganizer(@Param("organizerId") Long organizerId);

    @Query("SELECT e FROM Event e WHERE e.organizer.id = :organizerId AND e.status IN ('PUBLISHED', 'LIVE') ORDER BY e.eventDateTime ASC")
    Page<Event> findPublishedAndLiveEventsByOrganizerId(@Param("organizerId") Long organizerId, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.status = 'PUBLISHED' ORDER BY e.eventDateTime ASC")
    Page<Event> findUpcomingPublishedEvents(Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.country = :country AND e.status = 'PUBLISHED' ORDER BY e.eventDateTime ASC")
    Page<Event> findUpcomingEventsByCountry(@Param("country") String country, Pageable pageable);

    List<Event> findByStatusAndEventDateTimeIsBetween(Event.EventStatus status, LocalDateTime start, LocalDateTime end);

    int countByOrganizerIdAndStatus(Long organizerId, Event.EventStatus status);
}
