package com.xfrizon.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketTierRequest {
    @NotBlank(message = "Ticket type is required")
    private String ticketType;

    @NotBlank(message = "Currency is required")
    private String currency;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    @PositiveOrZero(message = "Max per person must be zero or positive")
    private Integer maxPerPerson;

    private String saleStart;

    @JsonAlias({"priceEnds"})
    private String saleEnd;

    @Deprecated
    private String priceEnds;

    private String description;
}
