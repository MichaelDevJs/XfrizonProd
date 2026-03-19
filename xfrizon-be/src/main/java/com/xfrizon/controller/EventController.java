package com.xfrizon.controller;

import com.xfrizon.dto.CreateEventRequest;
import com.xfrizon.dto.EventResponse;
import com.xfrizon.dto.EventRsvpRequest;
import com.xfrizon.dto.EventRsvpResponse;
import com.xfrizon.service.EventDashboardStats;
import com.xfrizon.service.EventService;
import com.xfrizon.util.FileUploadUtil;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.annotation.Nullable;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5177", "http://localhost:3000"}, maxAge = 3600)
public class EventController {

    private final EventService eventService;
    private final JwtTokenProvider jwtTokenProvider;
    private final FileUploadUtil fileUploadUtil;

    /**
     * Create a new event
     */
    @PostMapping
    public @Nullable ResponseEntity<EventResponse> createEvent(
        @Valid @RequestBody CreateEventRequest request,
        HttpServletRequest httpRequest
    ) {
        try {
            log.info("Creating event: {}", request.getTitle());
            
            Long organizerId = extractUserIdFromToken(httpRequest);
            log.debug("Event creation request for organizer: {}", organizerId);
            
            EventResponse response = eventService.createEvent(organizerId, request);
            log.info("Event created successfully with ID: {}", response.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error creating event", e);
            throw e;
        }
    }

    /**
     * Get a specific event
     */
    @GetMapping("/{eventId}")
    public @Nullable ResponseEntity<EventResponse> getEvent(
        @PathVariable Long eventId,
        HttpServletRequest httpRequest
    ) {
        try {
            Long organizerId = extractUserIdFromToken(httpRequest);
            EventResponse response = eventService.getEvent(eventId, organizerId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Event access denied or not found: eventId={}, error={}", eventId, e.getMessage());
            // Return 404 Not Found for missing event
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(null);
        }
    }

    /**
     * Get a specific event publicly (no authentication required)
     */
    @GetMapping("/public/details/{eventId}")
    public @Nullable ResponseEntity<EventResponse> getPublicEvent(
        @PathVariable Long eventId
    ) {
        EventResponse response = eventService.getPublicEvent(eventId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all events for the organizer
     */
    @GetMapping
    public @Nullable ResponseEntity<Page<EventResponse>> getOrganizerEvents(
        Pageable pageable,
        HttpServletRequest httpRequest
    ) {
        try {
            Long organizerId = extractUserIdFromToken(httpRequest);
            Page<EventResponse> events = eventService.getOrganizerEvents(organizerId, pageable);
            return ResponseEntity.ok(events);
        } catch (IllegalArgumentException e) {
            log.warn("Unauthorized access to /events: {}", e.getMessage());
            // Return 401 Unauthorized with proper error response
            throw e;
        }
    }

    /**
     * Update event
     */
    @PutMapping("/{eventId}")
    public @Nullable ResponseEntity<EventResponse> updateEvent(
        @PathVariable Long eventId,
        @RequestBody CreateEventRequest request,
        HttpServletRequest httpRequest
    ) {
        log.info("Updating event: {}", eventId);
        
        Long organizerId = extractUserIdFromToken(httpRequest);
        EventResponse response = eventService.updateEvent(eventId, organizerId, request);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Publish event
     */
    @PostMapping("/{eventId}/publish")
    public @Nullable ResponseEntity<EventResponse> publishEvent(
        @PathVariable Long eventId,
        HttpServletRequest httpRequest
    ) {
        log.info("Publishing event: {}", eventId);
        
        Long organizerId = extractUserIdFromToken(httpRequest);
        EventResponse response = eventService.publishEvent(eventId, organizerId);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Duplicate event (creates a new DRAFT copy)
     */
    @PostMapping("/{eventId}/duplicate")
    public @Nullable ResponseEntity<EventResponse> duplicateEvent(
        @PathVariable Long eventId,
        HttpServletRequest httpRequest
    ) {
        log.info("Duplicating event: {}", eventId);

        Long organizerId = extractUserIdFromToken(httpRequest);
        EventResponse response = eventService.duplicateEvent(eventId, organizerId);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Upload event flyer
     */
    @PostMapping("/{eventId}/flyer")
    public @Nullable ResponseEntity<EventResponse> uploadFlyer(
        @PathVariable Long eventId,
        @RequestParam("file") MultipartFile file,
        HttpServletRequest httpRequest
    ) {
        try {
            log.info("Uploading flyer for event: {}", eventId);
            
            Long organizerId = extractUserIdFromToken(httpRequest);
            String flyerUrl = fileUploadUtil.uploadFlyerImage(file);
            
            EventResponse response = eventService.updateEventFlyer(eventId, organizerId, flyerUrl);
            log.info("Flyer uploaded successfully for event: {}", eventId);
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Error uploading flyer for event: {}", eventId, e);
            throw new IllegalArgumentException("Failed to upload flyer: " + e.getMessage());
        }
    }

    /**
     * Cancel event
     */
    @PostMapping("/{eventId}/cancel")
    public @Nullable ResponseEntity<EventResponse> cancelEvent(
        @PathVariable Long eventId,
        @RequestParam(required = false) String reason,
        HttpServletRequest httpRequest
    ) {
        log.warn("Cancelling event: {}", eventId);
        
        Long organizerId = extractUserIdFromToken(httpRequest);
        EventResponse response = eventService.cancelEvent(eventId, organizerId, reason);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Delete event
     */
    @DeleteMapping("/{eventId}")
    public @Nullable ResponseEntity<Void> deleteEvent(
        @PathVariable Long eventId,
        HttpServletRequest httpRequest
    ) {
        log.info("Deleting event: {}", eventId);
        
        Long organizerId = extractUserIdFromToken(httpRequest);
        eventService.deleteEvent(eventId, organizerId);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Get upcoming events
     */
    @GetMapping("/public/upcoming")
    public @Nullable ResponseEntity<Page<EventResponse>> getUpcomingEvents(Pageable pageable) {
        Page<EventResponse> events = eventService.getUpcomingEvents(pageable);
        return ResponseEntity.ok(events);
    }

    /**
     * Get all published events
     */
    @GetMapping("/public/all")
    public @Nullable ResponseEntity<List<EventResponse>> getAllPublishedEvents() {
        List<EventResponse> events = eventService.getAllPublishedEvents();
        return ResponseEntity.ok(events);
    }

    /**
     * Get events by country
     */
    @GetMapping("/public/country/{country}")
    public @Nullable ResponseEntity<Page<EventResponse>> getEventsByCountry(
        @PathVariable String country,
        Pageable pageable
    ) {
        Page<EventResponse> events = eventService.getEventsByCountry(country, pageable);
        return ResponseEntity.ok(events);
    }

    /**
     * Get all public events by a specific organizer (organizer store/profile)
     */
    @GetMapping("/public/organizer/{organizerId}")
    public @Nullable ResponseEntity<Page<EventResponse>> getPublicOrganizerEvents(
        @PathVariable Long organizerId,
        Pageable pageable
    ) {
        Page<EventResponse> events = eventService.getPublicOrganizerEvents(organizerId, pageable);
        return ResponseEntity.ok(events);
    }

    /**
     * Get organizer dashboard stats
     */
    @GetMapping("/dashboard/stats")
    public @Nullable ResponseEntity<EventDashboardStats> getOrganizerStats(HttpServletRequest httpRequest) {
        Long organizerId = extractUserIdFromToken(httpRequest);
        EventDashboardStats stats = eventService.getOrganizerStats(organizerId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Save/bookmark an event for current user
     */
    @PostMapping("/{eventId}/save")
    public ResponseEntity<?> saveEvent(
        @PathVariable Long eventId,
        HttpServletRequest httpRequest
    ) {
        try {
            Long userId = extractUserIdFromToken(httpRequest);
            eventService.saveEvent(userId, eventId);
            // Return updated event with attendee info
            EventResponse updatedEvent = eventService.getPublicEvent(eventId);
            return ResponseEntity.ok(updatedEvent);
        } catch (IllegalArgumentException e) {
            log.warn("Error saving event: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            log.error("Error saving event", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(false, "Failed to save event"));
        }
    }

    /**
     * Unsave/unbookmark an event for current user
     */
    @DeleteMapping("/{eventId}/save")
    public ResponseEntity<?> unsaveEvent(
        @PathVariable Long eventId,
        HttpServletRequest httpRequest
    ) {
        try {
            Long userId = extractUserIdFromToken(httpRequest);
            eventService.unsaveEvent(userId, eventId);
            // Return updated event with attendee info
            EventResponse updatedEvent = eventService.getPublicEvent(eventId);
            return ResponseEntity.ok(updatedEvent);
        } catch (IllegalArgumentException e) {
            log.warn("Error unsaving event: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            log.error("Error unsaving event", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(false, "Failed to unsave event"));
        }
    }

    /**
     * Submit RSVP for an event (public – auth optional; userId passed if token present)
     */
    @PostMapping("/{eventId}/rsvp")
    public ResponseEntity<?> submitRsvp(
        @PathVariable Long eventId,
        @Valid @RequestBody EventRsvpRequest request,
        HttpServletRequest httpRequest
    ) {
        try {
            Long userId = extractUserIdOptional(httpRequest);
            EventRsvpResponse response = eventService.submitRsvp(eventId, userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.warn("RSVP rejected for event {}: {}", eventId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            log.error("Error submitting RSVP for event {}", eventId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(false, "Failed to submit RSVP"));
        }
    }

    /**
     * Get RSVPs for an event (organizer only)
     */
    @GetMapping("/{eventId}/rsvp")
    public ResponseEntity<?> getEventRsvps(
        @PathVariable Long eventId,
        HttpServletRequest httpRequest
    ) {
        try {
            Long organizerId = extractUserIdFromToken(httpRequest);
            List<EventRsvpResponse> rsvps = eventService.getEventRsvps(eventId, organizerId);
            return ResponseEntity.ok(rsvps);
        } catch (IllegalArgumentException e) {
            log.warn("RSVP list access denied for event {}: {}", eventId, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching RSVPs for event {}", eventId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(false, "Failed to fetch RSVPs"));
        }
    }

    /**
     * Get user's saved events
     */
    @GetMapping("/user/saved")
    public ResponseEntity<?> getUserSavedEvents(HttpServletRequest httpRequest) {
        try {
            Long userId = extractUserIdFromToken(httpRequest);
            List<EventResponse> savedEvents = eventService.getUserSavedEvents(userId);
            return ResponseEntity.ok(savedEvents);
        } catch (Exception e) {
            log.error("Error fetching saved events", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(false, "Failed to fetch saved events"));
        }
    }

    /**
     * Response wrapper class
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ApiResponse {
        private boolean success;
        private String message;
    }

    // Helper method to extract user ID from JWT token
    private Long extractUserIdFromToken(HttpServletRequest request) {
        String token = getTokenFromRequest(request);
        if (token == null) {
            log.warn("No authorization token found in request");
            throw new IllegalArgumentException("Missing authentication token");
        }
        if (!jwtTokenProvider.validateToken(token)) {
            log.warn("Invalid or expired token");
            throw new IllegalArgumentException("Invalid or expired authentication token");
        }
        return jwtTokenProvider.getUserIdFromToken(token);
    }

    /** Same as above but returns null instead of throwing when no token is present. */
    private Long extractUserIdOptional(HttpServletRequest request) {
        try {
            String token = getTokenFromRequest(request);
            if (token == null) return null;
            if (!jwtTokenProvider.validateToken(token)) return null;
            return jwtTokenProvider.getUserIdFromToken(token);
        } catch (Exception e) {
            return null;
        }
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
