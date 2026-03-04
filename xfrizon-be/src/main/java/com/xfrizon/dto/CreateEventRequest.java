package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEventRequest {
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    private String description;

    @NotBlank(message = "Event date/time is required")
    private String eventDateTime;

    private String eventEndDate;  // Optional - for multi-day events

    @NotBlank(message = "Venue name is required")
    private String venueName;

    @NotBlank(message = "Venue address is required")
    private String venueAddress;

    private String venueMapLink;

    private String country;  // Optional - will use default if empty

    private String city;  // Optional city field

    @NotBlank(message = "Currency is required")
    private String currency;

    private Integer ageLimit;

    private Integer capacity;

    private List<String> genres;

    private String flyerUrl;  // Optional - URL to event flyer image

    @NotEmpty(message = "At least one ticket tier is required")
    private List<TicketTierRequest> tickets;
}
