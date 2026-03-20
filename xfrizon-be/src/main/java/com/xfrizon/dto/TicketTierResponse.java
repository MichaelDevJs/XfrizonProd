package com.xfrizon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketTierResponse {
    private Long id;
    private String ticketType;
    private String currency;
    private BigDecimal price;
    private Integer quantity;
    private Integer quantitySold;
    private Integer maxPerPerson;
    private LocalDateTime saleStartsAt;
    private LocalDateTime saleEndsAt;
    private LocalDateTime saleStart;
    private LocalDateTime saleEnd;
    private String status;
    private String description;
}
