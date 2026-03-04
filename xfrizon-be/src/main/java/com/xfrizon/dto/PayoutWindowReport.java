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
public class PayoutWindowReport {

    private String window;
    private String cadence;
    private LocalDateTime windowStart;
    private LocalDateTime windowEnd;
    private Integer totalTicketsSold;
    private BigDecimal grossRevenue;
    private BigDecimal serviceFeeTotal;
    private BigDecimal netForOrganizer;
    private Integer paymentRecordsCount;
    private BigDecimal avgPricePerTicket;
}
