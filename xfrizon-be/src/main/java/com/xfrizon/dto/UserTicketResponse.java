package com.xfrizon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class UserTicketResponse {

    private Long id;

    @JsonProperty("event_id")
    private Long eventId;

    @JsonProperty("event_title")
    private String eventTitle;

    @JsonProperty("event_date")
    private LocalDateTime eventDate;

    @JsonProperty("event_location")
    private String eventLocation;

    @JsonProperty("event_flyer_url")
    private String eventFlyerUrl;

    @JsonProperty("ticket_id")
    private Long ticketId;

    @JsonProperty("ticket_type")
    private String ticketType;

    @JsonProperty("ticket_tier")
    private String ticketTier;

    private Integer quantity;

    @JsonProperty("purchase_date")
    private LocalDateTime purchaseDate;

    @JsonProperty("purchase_price")
    private BigDecimal purchasePrice;

    @JsonProperty("subtotal_price")
    private BigDecimal subtotalPrice;

    @JsonProperty("service_fee")
    private BigDecimal serviceFee;

    @JsonProperty("total_price")
    private BigDecimal totalPrice;

    @JsonProperty("currency")
    private String currency;

    private String status;

    @JsonProperty("qr_code_url")
    private String qrCodeUrl;

    @JsonProperty("pdf_url")
    private String pdfUrl;

    @JsonProperty("validation_code")
    private String validationCode;
    
    @JsonProperty("payment_intent_id")
    private String paymentIntentId;
    
    @JsonProperty("stripe_intent_id")
    private String stripeIntentId;

    @JsonProperty("buyer_name")
    private String buyerName;

    @JsonProperty("buyer_email")
    private String buyerEmail;

    @JsonProperty("ticket_number")
    private String ticketNumber;

    @JsonProperty("validated")
    private Boolean validated;

    // Nested event object for frontend
    private EventResponse event;

    public static UserTicketResponse fromEntity(com.xfrizon.entity.UserTicket ticket) {
        if (ticket == null) {
            System.err.println("[DEBUG] UserTicketResponse.fromEntity: ticket is null");
            return null;
        }
        com.xfrizon.entity.Event event = ticket.getEvent();
        com.xfrizon.entity.TicketTier tier = ticket.getTicketTier();
        if (event == null) System.err.println("[DEBUG] UserTicketResponse.fromEntity: event is null for ticketId=" + ticket.getId());
        if (tier == null) System.err.println("[DEBUG] UserTicketResponse.fromEntity: ticketTier is null for ticketId=" + ticket.getId());
        return UserTicketResponse.builder()
                .id(ticket.getId())
                .eventId(event != null ? event.getId() : null)
                .eventTitle(event != null ? event.getTitle() : null)
                .eventDate(event != null ? event.getEventDateTime() : null)
                .eventLocation(event != null ? (event.getVenueAddress() + (event.getCity() != null ? ", " + event.getCity() : "")) : null)
                .eventFlyerUrl(event != null ? event.getFlyerUrl() : null)
                .ticketId(tier != null ? tier.getId() : null)
                .ticketType(tier != null ? tier.getTicketType() : null)
                .ticketTier(tier != null ? tier.getTicketType() : null)
                .quantity(ticket.getQuantity())
                .purchaseDate(ticket.getPurchaseDate())
                .purchasePrice(ticket.getPurchasePrice())
                .subtotalPrice(ticket.getSubtotalPrice() != null ? ticket.getSubtotalPrice() : ticket.getPurchasePrice())
                .serviceFee(ticket.getServiceFee())
                .totalPrice(ticket.getTotalPrice() != null ? ticket.getTotalPrice() : ticket.getPurchasePrice())
                .currency(tier != null ? tier.getCurrency() : (event != null ? event.getCurrency() : null))
                .status(ticket.getStatus() != null ? ticket.getStatus().toString() : null)
                .qrCodeUrl(ticket.getQrCodeUrl())
                .pdfUrl(ticket.getPdfUrl())
                .validationCode(ticket.getValidationCode())
                .paymentIntentId(ticket.getPaymentIntentId())
                .stripeIntentId(ticket.getPaymentIntentId())
                .event(null) // Optionally map nested event if needed
                .build();
    }
}
