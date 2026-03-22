package com.xfrizon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_tickets", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_event_id", columnList = "event_id"),
    @Index(name = "idx_ticket_tier_id", columnList = "ticket_tier_id"),
    @Index(name = "idx_purchase_date", columnList = "purchase_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
public class UserTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_tier_id", nullable = false)
    private TicketTier ticketTier;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private BigDecimal purchasePrice;

    // Amount breakdown (major units)
    @Column(name = "subtotal_price", columnDefinition = "DECIMAL(19,2)")
    private BigDecimal subtotalPrice;

    @Column(name = "service_fee", columnDefinition = "DECIMAL(19,2)")
    private BigDecimal serviceFee;

    @Column(name = "total_price", columnDefinition = "DECIMAL(19,2)")
    private BigDecimal totalPrice;

    @Column(name = "purchase_date", nullable = false)
    private LocalDateTime purchaseDate;

    private String qrCodeData;

    private String qrCodeUrl;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TicketStatus status = TicketStatus.ACTIVE;

    private String validationCode;

    private String pdfUrl;

    @Column(name = "payment_intent_id")
    private String paymentIntentId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        purchaseDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TicketStatus {
        ACTIVE,
        USED,
        CANCELLED,
        EXPIRED,
        REFUNDED
    }
}
