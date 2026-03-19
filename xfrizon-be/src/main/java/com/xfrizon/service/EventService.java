package com.xfrizon.service;

import com.xfrizon.dto.CreateEventRequest;
import com.xfrizon.dto.EventResponse;
import com.xfrizon.dto.EventRsvpRequest;
import com.xfrizon.dto.EventRsvpResponse;
import com.xfrizon.dto.TicketTierRequest;
import com.xfrizon.dto.TicketTierResponse;
import com.xfrizon.entity.Event;
import com.xfrizon.entity.EventRsvp;
import com.xfrizon.entity.TicketTier;
import com.xfrizon.entity.User;
import com.xfrizon.entity.UserEvent;
import com.xfrizon.repository.EventRepository;
import com.xfrizon.repository.EventRsvpRepository;
import com.xfrizon.repository.TicketTierRepository;
import com.xfrizon.repository.UserRepository;
import com.xfrizon.repository.UserEventRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class EventService {

    private final EventRepository eventRepository;
    private final EventRsvpRepository eventRsvpRepository;
    private final TicketTierRepository ticketTierRepository;
    private final UserRepository userRepository;
    private final UserEventRepository userEventRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;
    private static final Set<String> SUPPORTED_RSVP_FIELDS = Set.of(
        "firstName", "lastName", "email", "phone", "note"
    );
    private static final List<String> DEFAULT_RSVP_FIELDS = Arrays.asList("firstName", "lastName", "email");

    /**
     * Create a new event with ticket tiers
     */
    public EventResponse createEvent(Long organizerId, CreateEventRequest request) {
        log.info("Creating event for organizer: {}", organizerId);

        User organizer = userRepository.findById(organizerId)
            .orElseThrow(() -> new IllegalArgumentException("Organizer not found"));

        if (organizer.getRole() != User.UserRole.ORGANIZER) {
            throw new IllegalArgumentException("User is not an organizer");
        }

        // Create Event entity
        Event event = Event.builder()
            .title(request.getTitle())
            .description(request.getDescription() != null ? request.getDescription() : "")
            .organizer(organizer)
            .eventDateTime(LocalDateTime.parse(request.getEventDateTime(), DATE_TIME_FORMATTER))
            .eventEndDate(request.getEventEndDate() != null && !request.getEventEndDate().isEmpty() ? 
                LocalDateTime.parse(request.getEventEndDate(), DATE_TIME_FORMATTER) : null)
            .venueName(request.getVenueName())
            .venueAddress(request.getVenueAddress() != null ? request.getVenueAddress() : "")
            .venueMapLink(request.getVenueMapLink())
            .country(request.getCountry() != null && !request.getCountry().isEmpty() ? request.getCountry() : "Unspecified")
            .city(request.getCity() != null ? request.getCity() : "")
            .currency(request.getCurrency())
            .ageLimit(request.getAgeLimit() != null ? request.getAgeLimit() : 0)
            .capacity(request.getCapacity() != null ? request.getCapacity() : 0)
            .genres(request.getGenres() != null ? request.getGenres() : new ArrayList<>())
            .rsvpEnabled(Boolean.TRUE.equals(request.getRsvpEnabled()))
            .rsvpCapacity(request.getRsvpCapacity() != null && request.getRsvpCapacity() > 0 ? request.getRsvpCapacity() : null)
            .rsvpRequiredFields(normalizeRsvpFields(request.getRsvpRequiredFields()))
            .ticketTiers(new ArrayList<>())
            .status(Event.EventStatus.DRAFT)
            .totalCapacity(BigDecimal.ZERO)
            .totalRevenue(BigDecimal.ZERO)
            .totalTicketsSold(0)
            .build();

        // Save event
        event = eventRepository.save(event);
        log.debug("Event saved with ID: {}", event.getId());

        // Create ticket tiers
        if (request.getTickets() != null && !request.getTickets().isEmpty()) {
            List<TicketTier> tiers = new ArrayList<>();
            BigDecimal totalCapacity = BigDecimal.ZERO;

            for (int i = 0; i < request.getTickets().size(); i++) {
                TicketTierRequest tierRequest = request.getTickets().get(i);
                
                TicketTier tier = TicketTier.builder()
                    .event(event)
                    .ticketType(tierRequest.getTicketType())
                    .currency(tierRequest.getCurrency())
                    .price(tierRequest.getPrice())
                    .quantity(tierRequest.getQuantity())
                    .quantitySold(0)
                    .maxPerPerson(tierRequest.getMaxPerPerson() != null ? tierRequest.getMaxPerPerson() : 1)
                    .saleEndsAt(tierRequest.getPriceEnds() != null ? 
                        LocalDateTime.parse(tierRequest.getPriceEnds(), DATE_TIME_FORMATTER) : null)
                    .status(TicketTier.TicketStatus.ACTIVE)
                    .description(tierRequest.getDescription())
                    .displayOrder(i)
                    .build();

                tiers.add(tier);
                if (tierRequest.getQuantity() != null) {
                    totalCapacity = totalCapacity.add(BigDecimal.valueOf(tierRequest.getQuantity()));
                }
            }

            ticketTierRepository.saveAll(tiers);
            event.setTicketTiers(tiers);
            event.setTotalCapacity(totalCapacity);
            event = eventRepository.save(event);
            log.debug("Created {} ticket tiers for event {}", tiers.size(), event.getId());
        }

        log.info("Event created successfully with ID: {}", event.getId());
        return mapEventToResponse(event);
    }

    /**
     * Publish an event (DRAFT -> PUBLISHED)
     */
    public EventResponse publishEvent(Long eventId, Long organizerId) {
        log.info("Publishing event: {} for organizer: {}", eventId, organizerId);

        Event event = getEventByIdAndOrganizer(eventId, organizerId);

        if (event.getStatus() != Event.EventStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT events can be published");
        }

        // Validate that organizer has set up payout system
        User organizer = event.getOrganizer();
        boolean hasStripeConnect = organizer.getStripeAccountId() != null && !organizer.getStripeAccountId().isBlank();
        boolean prefersManualPayout = Boolean.TRUE.equals(organizer.getPrefersManualPayout());
        
        if (!hasStripeConnect && !prefersManualPayout) {
            throw new IllegalStateException("PAYOUT_NOT_CONFIGURED: Please set up your payout method before publishing events. Go to Finance settings to connect Stripe or opt for manual payouts.");
        }

        event.setStatus(Event.EventStatus.PUBLISHED);
        event.setPublishedAt(LocalDateTime.now());
        event = eventRepository.save(event);

        log.info("Event published: {}", eventId);
        return mapEventToResponse(event);
    }

    /**
     * Duplicate an event for the same organizer as a new DRAFT event.
     */
    public EventResponse duplicateEvent(Long eventId, Long organizerId) {
        log.info("Duplicating event: {} for organizer: {}", eventId, organizerId);

        Event sourceEvent = getEventByIdAndOrganizer(eventId, organizerId);

        Event duplicatedEvent = Event.builder()
            .title(sourceEvent.getTitle() != null ? sourceEvent.getTitle() + " (Copy)" : "Untitled Event (Copy)")
            .description(sourceEvent.getDescription() != null ? sourceEvent.getDescription() : "")
            .organizer(sourceEvent.getOrganizer())
            .eventDateTime(sourceEvent.getEventDateTime())
            .eventEndDate(sourceEvent.getEventEndDate())
            .venueName(sourceEvent.getVenueName())
            .venueAddress(sourceEvent.getVenueAddress() != null ? sourceEvent.getVenueAddress() : "")
            .venueMapLink(sourceEvent.getVenueMapLink())
            .country(sourceEvent.getCountry() != null && !sourceEvent.getCountry().isEmpty() ? sourceEvent.getCountry() : "Unspecified")
            .city(sourceEvent.getCity() != null ? sourceEvent.getCity() : "")
            .currency(sourceEvent.getCurrency())
            .ageLimit(sourceEvent.getAgeLimit() != null ? sourceEvent.getAgeLimit() : 0)
            .capacity(sourceEvent.getCapacity() != null ? sourceEvent.getCapacity() : 0)
            .genres(sourceEvent.getGenres() != null ? new ArrayList<>(sourceEvent.getGenres()) : new ArrayList<>())
            .rsvpEnabled(Boolean.TRUE.equals(sourceEvent.getRsvpEnabled()))
            .rsvpCapacity(sourceEvent.getRsvpCapacity())
            .rsvpRequiredFields(sourceEvent.getRsvpRequiredFields() != null ? new ArrayList<>(sourceEvent.getRsvpRequiredFields()) : new ArrayList<>())
            .flyerUrl(sourceEvent.getFlyerUrl())
            .status(Event.EventStatus.DRAFT)
            .totalCapacity(BigDecimal.ZERO)
            .totalRevenue(BigDecimal.ZERO)
            .totalTicketsSold(0)
            .build();

        duplicatedEvent = eventRepository.save(duplicatedEvent);

        if (sourceEvent.getTicketTiers() != null && !sourceEvent.getTicketTiers().isEmpty()) {
            List<TicketTier> duplicatedTiers = new ArrayList<>();
            BigDecimal totalCapacity = BigDecimal.ZERO;

            for (int i = 0; i < sourceEvent.getTicketTiers().size(); i++) {
                TicketTier sourceTier = sourceEvent.getTicketTiers().get(i);

                TicketTier duplicatedTier = TicketTier.builder()
                    .event(duplicatedEvent)
                    .ticketType(sourceTier.getTicketType())
                    .currency(sourceTier.getCurrency())
                    .price(sourceTier.getPrice())
                    .quantity(sourceTier.getQuantity())
                    .quantitySold(0)
                    .maxPerPerson(sourceTier.getMaxPerPerson() != null ? sourceTier.getMaxPerPerson() : 1)
                    .saleEndsAt(sourceTier.getSaleEndsAt())
                    .status(TicketTier.TicketStatus.ACTIVE)
                    .description(sourceTier.getDescription())
                    .displayOrder(sourceTier.getDisplayOrder() != null ? sourceTier.getDisplayOrder() : i)
                    .build();

                duplicatedTiers.add(duplicatedTier);

                if (sourceTier.getQuantity() != null) {
                    totalCapacity = totalCapacity.add(BigDecimal.valueOf(sourceTier.getQuantity()));
                }
            }

            ticketTierRepository.saveAll(duplicatedTiers);
            duplicatedEvent.setTicketTiers(duplicatedTiers);
            duplicatedEvent.setTotalCapacity(totalCapacity);
            duplicatedEvent = eventRepository.save(duplicatedEvent);
        }

        log.info("Event duplicated successfully: sourceEventId={}, newEventId={}", eventId, duplicatedEvent.getId());
        return mapEventToResponse(duplicatedEvent);
    }

    /**
     * Get event by ID and organizer (for authorization)
     */
    public EventResponse getEvent(Long eventId, Long organizerId) {
        Event event = getEventByIdAndOrganizer(eventId, organizerId);
        return mapEventToResponse(event);
    }

    /**
     * Get all events for an organizer
     */
    public Page<EventResponse> getOrganizerEvents(Long organizerId, Pageable pageable) {
        Page<Event> events = eventRepository.findByOrganizerId(organizerId, pageable);
        return events.map(this::mapEventToResponse);
    }

    /**
     * Get event by ID (public endpoint - no authentication required)
     */
    public EventResponse getPublicEvent(Long eventId) {
        log.info("Fetching public event: {}", eventId);
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> {
                log.warn("Event not found: {}", eventId);
                return new IllegalArgumentException("Event not found");
            });
        return mapEventToResponse(event);
    }

    /**
     * Get all published events (public endpoint)
     */
    public List<EventResponse> getAllPublishedEvents() {
        log.info("Fetching all published events");
        List<Event> events = eventRepository.findByStatus(Event.EventStatus.PUBLISHED);
        return events.stream()
            .map(this::mapEventToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get upcoming published events (public endpoint)
     */
    public Page<EventResponse> getUpcomingEvents(Pageable pageable) {
        log.info("Fetching upcoming published events");
        Page<Event> events = eventRepository.findUpcomingPublishedEvents(pageable);
        return events.map(this::mapEventToResponse);
    }

    /**
     * Get events by country (public endpoint)
     */
    public Page<EventResponse> getEventsByCountry(String country, Pageable pageable) {
        log.info("Fetching events for country: {}", country);
        Page<Event> events = eventRepository.findUpcomingEventsByCountry(country, pageable);
        return events.map(this::mapEventToResponse);
    }

    /**
     * Get all public events by a specific organizer (organizer store/profile)
     */
    public Page<EventResponse> getPublicOrganizerEvents(Long organizerId, Pageable pageable) {
        log.info("Fetching public events for organizer: {}", organizerId);
        
        // Verify organizer exists
        User organizer = userRepository.findById(organizerId)
            .orElseThrow(() -> {
                log.warn("Organizer not found: {}", organizerId);
                return new IllegalArgumentException("Organizer not found");
            });
        
        if (organizer.getRole() != User.UserRole.ORGANIZER) {
            throw new IllegalArgumentException("User is not an organizer");
        }
        
        // Get only PUBLISHED and LIVE events from this organizer
        Page<Event> events = eventRepository.findPublishedAndLiveEventsByOrganizerId(organizerId, pageable);
        return events.map(this::mapEventToResponse);
    }

    /**
     * Update event
     */
    public EventResponse updateEvent(Long eventId, Long organizerId, CreateEventRequest request) {
        log.info("Updating event: {} for organizer: {}", eventId, organizerId);

        Event event = getEventByIdAndOrganizer(eventId, organizerId);

        // Allow updating DRAFT and PUBLISHED events, but not completed, cancelled, or live events
        if (event.getStatus() == Event.EventStatus.COMPLETED || 
            event.getStatus() == Event.EventStatus.CANCELLED || 
            event.getStatus() == Event.EventStatus.LIVE) {
            throw new IllegalStateException("Cannot update events with status: " + event.getStatus());
        }

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription() != null ? request.getDescription() : "");
        event.setEventDateTime(LocalDateTime.parse(request.getEventDateTime(), DATE_TIME_FORMATTER));
        event.setEventEndDate(request.getEventEndDate() != null && !request.getEventEndDate().isEmpty() ? 
            LocalDateTime.parse(request.getEventEndDate(), DATE_TIME_FORMATTER) : null);
        event.setVenueName(request.getVenueName());
        event.setVenueAddress(request.getVenueAddress() != null ? request.getVenueAddress() : "");
        event.setCountry(request.getCountry() != null && !request.getCountry().isEmpty() ? request.getCountry() : "Unspecified");
        event.setCity(request.getCity() != null ? request.getCity() : "");
        event.setCurrency(request.getCurrency());
        event.setAgeLimit(request.getAgeLimit() != null ? request.getAgeLimit() : 0);
        event.setCapacity(request.getCapacity() != null ? request.getCapacity() : 0);
        event.setGenres(request.getGenres() != null ? request.getGenres() : new ArrayList<>());
        event.setRsvpEnabled(Boolean.TRUE.equals(request.getRsvpEnabled()));
        event.setRsvpCapacity(request.getRsvpCapacity() != null && request.getRsvpCapacity() > 0 ? request.getRsvpCapacity() : null);
        event.setRsvpRequiredFields(normalizeRsvpFields(request.getRsvpRequiredFields()));
        
        // Update flyer URL if provided
        if (request.getFlyerUrl() != null && !request.getFlyerUrl().isEmpty()) {
            event.setFlyerUrl(request.getFlyerUrl());
            log.debug("Updated flyerUrl for event {}: {}", eventId, request.getFlyerUrl());
        }

        // Update ticket tiers
        if (request.getTickets() != null && !request.getTickets().isEmpty()) {
            // Get existing ticket tiers
            List<TicketTier> existingTiers = event.getTicketTiers() == null
                ? new ArrayList<>()
                : new ArrayList<>(event.getTicketTiers());
            
            // Delete existing ticket tiers (only if not yet sold)
            if (!existingTiers.isEmpty()) {
                for (TicketTier tier : existingTiers) {
                    if (tier.getQuantitySold() == null || tier.getQuantitySold() == 0) {
                        ticketTierRepository.delete(tier);
                        log.debug("Deleted ticket tier: {}", tier.getId());
                    } else {
                        log.warn("Cannot delete ticket tier {} - {} tickets already sold", 
                            tier.getId(), tier.getQuantitySold());
                    }
                }
                // Clear the collection reference that Hibernate is tracking
                if (event.getTicketTiers() != null) {
                    event.getTicketTiers().clear();
                } else {
                    event.setTicketTiers(new ArrayList<>());
                }
            }

            // Create new ticket tiers
            List<TicketTier> newTiers = new ArrayList<>();
            BigDecimal totalCapacity = BigDecimal.ZERO;

            for (int i = 0; i < request.getTickets().size(); i++) {
                TicketTierRequest tierRequest = request.getTickets().get(i);
                
                TicketTier tier = TicketTier.builder()
                    .event(event)
                    .ticketType(tierRequest.getTicketType())
                    .currency(tierRequest.getCurrency())
                    .price(tierRequest.getPrice())
                    .quantity(tierRequest.getQuantity())
                    .quantitySold(0)
                    .maxPerPerson(tierRequest.getMaxPerPerson() != null ? tierRequest.getMaxPerPerson() : 1)
                    .saleEndsAt(tierRequest.getPriceEnds() != null ? 
                        LocalDateTime.parse(tierRequest.getPriceEnds(), DATE_TIME_FORMATTER) : null)
                    .status(TicketTier.TicketStatus.ACTIVE)
                    .description(tierRequest.getDescription())
                    .displayOrder(i)
                    .build();

                newTiers.add(tier);
                if (tierRequest.getQuantity() != null) {
                    totalCapacity = totalCapacity.add(BigDecimal.valueOf(tierRequest.getQuantity()));
                }
            }

            ticketTierRepository.saveAll(newTiers);
            // Add new tiers to the event's collection (maintaining Hibernate reference)
            if (event.getTicketTiers() == null) {
                event.setTicketTiers(new ArrayList<>());
            }
            event.getTicketTiers().addAll(newTiers);
            event.setTotalCapacity(totalCapacity);
            log.debug("Created {} new ticket tiers for event {}", newTiers.size(), event.getId());
        }

        event = eventRepository.save(event);
        log.info("Event updated: {}", eventId);
        return mapEventToResponse(event);
    }

    /**
     * Cancel event
     */
    public EventResponse cancelEvent(Long eventId, Long organizerId, String reason) {
        log.warn("Cancelling event: {} for organizer: {}", eventId, organizerId);

        Event event = getEventByIdAndOrganizer(eventId, organizerId);

        if (event.getStatus() == Event.EventStatus.COMPLETED || event.getStatus() == Event.EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot cancel " + event.getStatus() + " events");
        }

        event.setStatus(Event.EventStatus.CANCELLED);
        event.setCancelledAt(LocalDateTime.now());
        event.setCancellableReason(reason);
        event = eventRepository.save(event);

        log.info("Event cancelled: {}", eventId);
        return mapEventToResponse(event);
    }

    /**
     * Delete event (only for DRAFT)
     */
    public void deleteEvent(Long eventId, Long organizerId) {
        log.info("Deleting event: {} for organizer: {}", eventId, organizerId);

        Event event = getEventByIdAndOrganizer(eventId, organizerId);

        if (event.getStatus() != Event.EventStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT events can be deleted");
        }

        eventRepository.delete(event);
        log.info("Event deleted: {}", eventId);
    }

    /**
     * Get event dashboard stats for organizer
     */
    public EventDashboardStats getOrganizerStats(Long organizerId) {
        int draftCount = eventRepository.countByOrganizerIdAndStatus(organizerId, Event.EventStatus.DRAFT);
        int publishedCount = eventRepository.countByOrganizerIdAndStatus(organizerId, Event.EventStatus.PUBLISHED);
        int liveCount = eventRepository.countByOrganizerIdAndStatus(organizerId, Event.EventStatus.LIVE);
        int completedCount = eventRepository.countByOrganizerIdAndStatus(organizerId, Event.EventStatus.COMPLETED);

        return EventDashboardStats.builder()
            .draftCount(draftCount)
            .publishedCount(publishedCount)
            .liveCount(liveCount)
            .completedCount(completedCount)
            .totalCount(draftCount + publishedCount + liveCount + completedCount)
            .build();
    }

    /**
     * Update event flyer
     */
    public EventResponse updateEventFlyer(Long eventId, Long organizerId, String flyerUrl) {
        log.info("Updating flyer for event: {} by organizer: {}", eventId, organizerId);
        
        Event event = getEventByIdAndOrganizer(eventId, organizerId);
        event.setFlyerUrl(flyerUrl);
        event = eventRepository.save(event);
        
        log.info("Event flyer updated: {}", eventId);
        return mapEventToResponse(event);
    }

    public EventRsvpResponse submitRsvp(Long eventId, Long userId, EventRsvpRequest request) {
        log.info("Submitting RSVP for event {} and user {}", eventId, userId);

        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        if (!Boolean.TRUE.equals(event.getRsvpEnabled())) {
            throw new IllegalStateException("RSVP is not enabled for this event");
        }

        if (event.getStatus() != Event.EventStatus.PUBLISHED && event.getStatus() != Event.EventStatus.LIVE) {
            throw new IllegalStateException("RSVP is available only for published events");
        }

        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId)
                .orElse(null);
        }

        List<String> requiredFields = normalizeRsvpFields(event.getRsvpRequiredFields());
        validateRsvpPayload(requiredFields, request);

        String normalizedEmail = safeTrim(request.getEmail()).toLowerCase(Locale.ROOT);

        EventRsvp existingForUser = (user != null)
            ? eventRsvpRepository.findByEventIdAndUserId(eventId, user.getId()).orElse(null)
            : null;

        EventRsvp existingForEmail = eventRsvpRepository
            .findByEventIdAndEmailIgnoreCase(eventId, normalizedEmail)
            .orElse(null);

        EventRsvp existingRsvp = existingForUser != null ? existingForUser : existingForEmail;

        int confirmedCount = eventRsvpRepository.countByEventIdAndStatus(eventId, EventRsvp.RsvpStatus.CONFIRMED);
        if (event.getRsvpCapacity() != null && event.getRsvpCapacity() > 0) {
            boolean isNewRsvp = existingRsvp == null;
            if (isNewRsvp && confirmedCount >= event.getRsvpCapacity()) {
                throw new IllegalStateException("RSVP capacity has been reached");
            }
        }

        EventRsvp rsvp = existingRsvp != null
            ? existingRsvp
            : EventRsvp.builder().event(event).build();

        rsvp.setUser(user);
        rsvp.setFirstName(safeTrim(request.getFirstName()));
        rsvp.setLastName(safeTrim(request.getLastName()));
        rsvp.setEmail(normalizedEmail);
        rsvp.setPhone(safeTrim(request.getPhone()));
        rsvp.setNote(safeTrim(request.getNote()));
        rsvp.setStatus(EventRsvp.RsvpStatus.CONFIRMED);

        EventRsvp saved = eventRsvpRepository.save(rsvp);
        return mapRsvpToResponse(saved);
    }

    public List<EventRsvpResponse> getEventRsvps(Long eventId, Long organizerId) {
        Event event = getEventByIdAndOrganizer(eventId, organizerId);
        return eventRsvpRepository.findByEventIdOrderByCreatedAtDesc(event.getId()).stream()
            .map(this::mapRsvpToResponse)
            .collect(Collectors.toList());
    }

    // Helper methods

    private Event getEventByIdAndOrganizer(Long eventId, Long organizerId) {
        return eventRepository.findByIdAndOrganizerId(eventId, organizerId)
            .orElseThrow(() -> {
                log.warn("Event not found: {} for organizer: {}", eventId, organizerId);
                return new IllegalArgumentException("Event not found or unauthorized access");
            });
    }

    private EventResponse mapEventToResponse(Event event) {
        List<TicketTier> sourceTiers = event.getTicketTiers() == null
            ? new ArrayList<>()
            : event.getTicketTiers();

        List<TicketTierResponse> ticketTiers = sourceTiers.stream()
            .map(this::mapTicketTierToResponse)
            .collect(Collectors.toList());

        // Build organizer info (handle null organizer gracefully)
        EventResponse.OrganizerInfo organizerInfo = null;
        if (event.getOrganizer() != null) {
            organizerInfo = EventResponse.OrganizerInfo.builder()
                .id(event.getOrganizer().getId())
                .name(event.getOrganizer().getFirstName() + " " + event.getOrganizer().getLastName())
                .logo(event.getOrganizer().getProfilePicture())
                .email(event.getOrganizer().getEmail())
                .build();
        }

        // Build attendee info (limit to 10 most recent - includes both ticket buyers and saved event users)
        List<EventResponse.AttendeeInfo> attendees = new ArrayList<>();
        if (event.getId() != null) {
            // Query for interested users (ticket buyers + saved event users, limit to 10)
            attendees = userRepository.findEventInterestedUsers(event.getId(), 10).stream()
                .map(user -> EventResponse.AttendeeInfo.builder()
                    .id(user.getId())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .profilePicture(user.getProfilePicture())
                    .build())
                .collect(Collectors.toList());
        }

        return EventResponse.builder()
            .id(event.getId())
            .title(event.getTitle())
            .description(event.getDescription())
            .eventDateTime(event.getEventDateTime())
            .eventEndDate(event.getEventEndDate())
            .venueName(event.getVenueName())
            .venueAddress(event.getVenueAddress())
            .country(event.getCountry())
            .city(event.getCity())
            .currency(event.getCurrency())
            .status(event.getStatus().toString())
            .ageLimit(event.getAgeLimit())
            .capacity(event.getCapacity())
            .totalRevenue(event.getTotalRevenue())
            .totalTicketsSold(event.getTotalTicketsSold())
            .flyerUrl(event.getFlyerUrl())
            .genres(event.getGenres())
            .rsvpEnabled(Boolean.TRUE.equals(event.getRsvpEnabled()))
            .rsvpCapacity(event.getRsvpCapacity())
            .rsvpRequiredFields(normalizeRsvpFields(event.getRsvpRequiredFields()))
            .rsvpCount(eventRsvpRepository.countByEventIdAndStatus(event.getId(), EventRsvp.RsvpStatus.CONFIRMED))
            .ticketTiers(ticketTiers)
            .createdAt(event.getCreatedAt())
            .publishedAt(event.getPublishedAt())
            .organizer(organizerInfo)
            .attendees(attendees)
            .build();
    }

    private EventRsvpResponse mapRsvpToResponse(EventRsvp rsvp) {
        return EventRsvpResponse.builder()
            .id(rsvp.getId())
            .eventId(rsvp.getEvent() != null ? rsvp.getEvent().getId() : null)
            .userId(rsvp.getUser() != null ? rsvp.getUser().getId() : null)
            .firstName(rsvp.getFirstName())
            .lastName(rsvp.getLastName())
            .email(rsvp.getEmail())
            .phone(rsvp.getPhone())
            .note(rsvp.getNote())
            .status(rsvp.getStatus() != null ? rsvp.getStatus().name() : null)
            .createdAt(rsvp.getCreatedAt())
            .updatedAt(rsvp.getUpdatedAt())
            .build();
    }

    private List<String> normalizeRsvpFields(List<String> requestedFields) {
        List<String> fields = requestedFields == null ? new ArrayList<>() : requestedFields.stream()
            .map(this::safeTrim)
            .filter(value -> !value.isEmpty())
            .collect(Collectors.toList());

        if (fields.isEmpty()) {
            fields = new ArrayList<>(DEFAULT_RSVP_FIELDS);
        }

        List<String> filtered = fields.stream()
            .filter(SUPPORTED_RSVP_FIELDS::contains)
            .distinct()
            .collect(Collectors.toList());

        if (!filtered.contains("firstName")) {
            filtered.add(0, "firstName");
        }
        if (!filtered.contains("lastName")) {
            filtered.add(filtered.contains("firstName") ? 1 : 0, "lastName");
        }
        if (!filtered.contains("email")) {
            filtered.add("email");
        }

        return filtered;
    }

    private void validateRsvpPayload(List<String> requiredFields, EventRsvpRequest request) {
        if (requiredFields.contains("firstName") && safeTrim(request.getFirstName()).isEmpty()) {
            throw new IllegalArgumentException("First name is required for RSVP");
        }
        if (requiredFields.contains("lastName") && safeTrim(request.getLastName()).isEmpty()) {
            throw new IllegalArgumentException("Last name is required for RSVP");
        }
        if (requiredFields.contains("email") && safeTrim(request.getEmail()).isEmpty()) {
            throw new IllegalArgumentException("Email is required for RSVP");
        }
        if (requiredFields.contains("phone") && safeTrim(request.getPhone()).isEmpty()) {
            throw new IllegalArgumentException("Phone is required for RSVP");
        }
        if (requiredFields.contains("note") && safeTrim(request.getNote()).isEmpty()) {
            throw new IllegalArgumentException("Note is required for RSVP");
        }
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private TicketTierResponse mapTicketTierToResponse(TicketTier tier) {
        if (tier == null) {
            return null;
        }

        return TicketTierResponse.builder()
            .id(tier.getId())
            .ticketType(tier.getTicketType() != null ? tier.getTicketType() : "")
            .currency(tier.getCurrency() != null ? tier.getCurrency() : "USD")
            .price(tier.getPrice() != null ? tier.getPrice() : BigDecimal.ZERO)
            .quantity(tier.getQuantity() != null ? tier.getQuantity() : 0)
            .quantitySold(tier.getQuantitySold() != null ? tier.getQuantitySold() : 0)
            .maxPerPerson(tier.getMaxPerPerson() != null ? tier.getMaxPerPerson() : 1)
            .saleEndsAt(tier.getSaleEndsAt())
            .status(tier.getStatus() != null ? tier.getStatus().toString() : "ACTIVE")
            .description(tier.getDescription())
            .build();
    }

    /**
     * Save an event for the current user (add to interested/saved list)
     */
    public void saveEvent(Long userId, Long eventId) {
        log.info("Saving event {} for user {}", eventId, userId);

        // Verify user exists
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Verify event exists
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        // Check if already saved - if so, silently return (idempotent)
        if (userEventRepository.existsByUserIdAndEventId(userId, eventId)) {
            log.debug("Event {} already saved by user {}, returning silently", eventId, userId);
            return;
        }

        // Create and save user-event relationship
        UserEvent userEvent = UserEvent.builder()
            .user(user)
            .event(event)
            .build();

        userEventRepository.save(userEvent);
        log.info("Event {} saved for user {}", eventId, userId);
    }

    /**
     * Unsave an event for the current user (remove from interested/saved list)
     */
    public void unsaveEvent(Long userId, Long eventId) {
        log.info("Unsaving event {} for user {}", eventId, userId);

        UserEvent userEvent = userEventRepository.findByUserIdAndEventId(userId, eventId)
            .orElseThrow(() -> new IllegalArgumentException("Event not saved by this user"));

        userEventRepository.delete(userEvent);
        log.info("Event {} unsaved for user {}", eventId, userId);
    }

    /**
     * Get all saved events for a user
     */
    public List<EventResponse> getUserSavedEvents(Long userId) {
        log.info("Fetching saved events for user {}", userId);

        // Verify user exists
        userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Event> savedEvents = userEventRepository.findSavedEventsByUserId(userId);

        return savedEvents.stream()
            .map(this::mapEventToResponse)
            .collect(Collectors.toList());
    }
}
