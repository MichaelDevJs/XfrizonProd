package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime eventDateTime;
    private LocalDateTime eventEndDate;
    private String venueName;
    private String venueAddress;
    private String country;
    private String city;
    private String currency;
    private String status;
    private Integer ageLimit;
    private Integer capacity;
    private BigDecimal totalRevenue;
    private Integer totalTicketsSold;
    private String flyerUrl;
    private List<String> genres;
    private Boolean rsvpEnabled;
    private Integer rsvpCapacity;
    private List<String> rsvpRequiredFields;
    private Integer rsvpCount;
    private List<TicketTierResponse> ticketTiers;
    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;
    private OrganizerInfo organizer;
    private List<AttendeeInfo> attendees;

    /**
     * Nested attendee information for social display
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttendeeInfo {
        private Long id;
        private String firstName;
        private String lastName;
        private String profilePicture;
    }

    /**
     * Nested organizer information for event cards
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrganizerInfo {
        private Long id;
        private String name;
        private String logo;
        private String email;
    }
}
