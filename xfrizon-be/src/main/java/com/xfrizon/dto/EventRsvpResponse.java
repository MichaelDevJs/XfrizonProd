package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventRsvpResponse {
    private Long id;
    private Long eventId;
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String note;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
