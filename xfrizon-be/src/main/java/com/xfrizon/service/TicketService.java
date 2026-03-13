package com.xfrizon.service;

import com.xfrizon.dto.EventResponse;
import com.xfrizon.dto.TicketPurchaseRequest;
import com.xfrizon.dto.UserTicketResponse;
import com.xfrizon.entity.Event;
import com.xfrizon.entity.PaymentRecord;
import com.xfrizon.entity.TicketTier;
import com.xfrizon.entity.User;
import com.xfrizon.entity.UserTicket;
import com.xfrizon.repository.EventRepository;
import com.xfrizon.repository.PaymentRecordRepository;
import com.xfrizon.repository.TicketTierRepository;
import com.xfrizon.repository.UserRepository;
import com.xfrizon.repository.UserTicketRepository;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TicketService {

    @Value("${xfrizon.service-fee-rate:0.10}")
    private BigDecimal serviceFeeRate;

    private final UserTicketRepository userTicketRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final TicketTierRepository ticketTierRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final EmailService emailService;
    private final PdfGenerationService pdfGenerationService;
    private final ReferralConversionService referralConversionService;

    /**
     * Record a ticket purchase after successful payment
     */
    public UserTicketResponse recordTicketPurchase(Long userId, TicketPurchaseRequest request) {
        try {
            log.info("Recording ticket purchase for user: {}, event: {}, quantity: {}",
                    userId, request.getEventId(), request.getQuantity());

            // Validate payment succeeded
            PaymentRecord paymentRecord = paymentRecordRepository.findByStripeIntentId(request.getPaymentIntentId())
                    .orElseThrow(() -> new IllegalArgumentException("Payment record not found"));

            if (!paymentRecord.getStatus().equals(PaymentRecord.PaymentStatus.SUCCEEDED)) {
                throw new IllegalArgumentException("Payment not successful");
            }

            // Validate user and event
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            Event event = eventRepository.findById(request.getEventId())
                    .orElseThrow(() -> new IllegalArgumentException("Event not found"));

            TicketTier ticketTier = ticketTierRepository.findById(request.getTicketId())
                    .orElseThrow(() -> new IllegalArgumentException("Ticket tier not found"));

            // Validate ticket tier belongs to event
            if (!ticketTier.getEvent().getId().equals(event.getId())) {
                throw new IllegalArgumentException("Ticket tier does not belong to this event");
            }

            // Compute authoritative amounts (major units)
            BigDecimal unitPrice = ticketTier.getPrice() != null ? ticketTier.getPrice() : BigDecimal.ZERO;
            BigDecimal quantity = BigDecimal.valueOf(request.getQuantity() != null ? request.getQuantity() : 0);
            BigDecimal subtotal = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
            BigDecimal serviceFee = subtotal.multiply(serviceFeeRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal total = subtotal.add(serviceFee).setScale(2, RoundingMode.HALF_UP);

            // Update ticket tier sold quantity
            Integer currentSold = ticketTier.getQuantitySold();
            ticketTier.setQuantitySold(currentSold + request.getQuantity());
            ticketTierRepository.save(ticketTier);

            // Create individual user ticket records for each ticket purchased
            List<UserTicket> savedTickets = new ArrayList<>();
            Integer quantityToPurchase = request.getQuantity() != null ? request.getQuantity() : 1;
            
            // Price per individual ticket
            BigDecimal pricePerTicket = unitPrice;
            BigDecimal serviceFeePerTicket = subtotal.divide(BigDecimal.valueOf(quantityToPurchase), 2, RoundingMode.HALF_UP)
                    .multiply(serviceFeeRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalPerTicket = pricePerTicket.add(serviceFeePerTicket).setScale(2, RoundingMode.HALF_UP);

            for (int i = 0; i < quantityToPurchase; i++) {
                // Generate unique validation code and QR code for each ticket
                String validationCode = UUID.randomUUID().toString().substring(0, 12).toUpperCase();
                String qrCodeData = generateQRCodeData(user.getId(), event.getId(), ticketTier.getId(), validationCode);

                // Create individual user ticket record
                UserTicket userTicket = UserTicket.builder()
                        .user(user)
                        .event(event)
                        .ticketTier(ticketTier)
                        .quantity(1)  // Each individual ticket record has quantity = 1
                        .purchasePrice(pricePerTicket)
                        .subtotalPrice(pricePerTicket)
                        .serviceFee(serviceFeePerTicket)
                        .totalPrice(totalPerTicket)
                        .validationCode(validationCode)
                        .qrCodeData(qrCodeData)
                        .paymentIntentId(request.getPaymentIntentId())
                        .status(UserTicket.TicketStatus.ACTIVE)
                        .build();

                UserTicket savedTicket = userTicketRepository.save(userTicket);
                savedTickets.add(savedTicket);
            }

            referralConversionService.trackTicketPurchaseConversion(
                    request.getReferralCode(),
                    user,
                    event,
                    request.getPaymentIntentId()
            );

            log.info("Ticket purchase recorded: {} individual tickets created for payment intent: {}", quantityToPurchase, request.getPaymentIntentId());
            
            // Use the first ticket as reference for response (frontend already handles multiple tickets)
            UserTicket userTicket = savedTickets.get(0);

            // Convert to response
            UserTicketResponse response = convertToResponse(userTicket);

            // Send confirmation email
            try {
                emailService.sendTicketConfirmationEmail(response, user);
            } catch (Exception e) {
                log.warn("Failed to send confirmation email for ticket {}: {}", userTicket.getId(), e.getMessage());
                // Don't fail the purchase if email fails
            }

            return response;

        } catch (Exception e) {
            log.error("Error recording ticket purchase", e);
            throw new RuntimeException("Error recording ticket purchase: " + e.getMessage(), e);
        }
    }

    /**
     * Get user's tickets with pagination
     */
    public Page<UserTicketResponse> getUserTickets(Long userId, Pageable pageable) {
        log.info("Fetching tickets for user: {}", userId);

        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return userTicketRepository.findByUserId(userId, pageable)
                .map(this::convertToResponse);
    }

    /**
     * Get user's tickets without pagination (list)
     */
    public List<UserTicketResponse> getUserTicketsList(Long userId) {
        log.info("Fetching tickets list for user: {}", userId);

        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return userTicketRepository.findByUserIdOrderByPurchaseDateDesc(userId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get specific ticket
     */
    public UserTicketResponse getTicket(Long ticketId, Long userId) {
        log.info("Fetching ticket: {}", ticketId);

        UserTicket userTicket = userTicketRepository.findByIdAndUserId(ticketId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        return convertToResponse(userTicket);
    }

    /**
     * Get event's tickets
     */
    public Page<UserTicketResponse> getEventTickets(Long eventId, Pageable pageable) {
        log.info("Fetching tickets for event: {}", eventId);

        // Verify event exists
        eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        return userTicketRepository.findByEventId(eventId, pageable)
                .map(this::convertToResponse);
    }

    /**
     * Cancel ticket (for testing, in production may have restrictions)
     */
    public UserTicketResponse cancelTicket(Long ticketId, Long userId) {
        log.info("Cancelling ticket: {} for user: {}", ticketId, userId);

        UserTicket userTicket = userTicketRepository.findByIdAndUserId(ticketId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        userTicket.setStatus(UserTicket.TicketStatus.CANCELLED);
        userTicket = userTicketRepository.save(userTicket);

        // Update ticket tier quantity
        TicketTier ticketTier = userTicket.getTicketTier();
        ticketTier.setQuantitySold(ticketTier.getQuantitySold() - userTicket.getQuantity());
        ticketTierRepository.save(ticketTier);

        return convertToResponse(userTicket);
    }

    /**
     * Mark ticket as used
     */
    public UserTicketResponse markTicketAsUsed(Long ticketId, Long userId) {
        log.info("Marking ticket as used: {}", ticketId);

        UserTicket userTicket = userTicketRepository.findByIdAndUserId(ticketId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        userTicket.setStatus(UserTicket.TicketStatus.USED);
        userTicket = userTicketRepository.save(userTicket);

        return convertToResponse(userTicket);
    }

    /**
     * Generate QR code data (JSON string with ticket info)
     */
    private String generateQRCodeData(Long userId, Long eventId, Long ticketTierId, String validationCode) {
        return String.format("{\"user_id\":%d,\"event_id\":%d,\"ticket_tier_id\":%d,\"validation_code\":\"%s\",\"timestamp\":%d}",
                userId, eventId, ticketTierId, validationCode, System.currentTimeMillis());
    }

    /**
     * Convert UserTicket entity to response DTO
     */
    private UserTicketResponse convertToResponse(UserTicket userTicket) {
        if (userTicket == null) {
            return null;
        }

        Event event = userTicket.getEvent();
        TicketTier ticketTier = userTicket.getTicketTier();
        String resolvedCurrency = ticketTier != null && ticketTier.getCurrency() != null
            ? ticketTier.getCurrency()
            : (event != null ? event.getCurrency() : null);

        if (event == null || ticketTier == null) {
            log.warn("Ticket {} has null event or ticketTier", userTicket.getId());
            return null;
        }

        // Build location string safely
        String eventLocation = buildEventLocation(event);

        // Build nested event response
        EventResponse eventResponse = EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventDateTime(event.getEventDateTime())
                .venueName(event.getVenueName())
                .venueAddress(event.getVenueAddress())
                .city(event.getCity())
                .country(event.getCountry())
                .flyerUrl(event.getFlyerUrl())
            .currency(resolvedCurrency)
                .build();

        String buyerName = "Unknown";
        String buyerEmail = "Unknown";
        
        if (userTicket.getUser() != null) {
            User user = userTicket.getUser();
            // Concatenate first and last name from database
            String firstName = user.getFirstName() != null ? user.getFirstName() : "";
            String lastName = user.getLastName() != null ? user.getLastName() : "";
            buyerName = (firstName + " " + lastName).trim();
            if (buyerName.isEmpty()) {
                buyerName = "Unknown";
            }
            buyerEmail = user.getEmail() != null ? user.getEmail() : "Unknown";
        }
        
        String ticketNumber = userTicket.getValidationCode() != null ? userTicket.getValidationCode() : "TKT-" + userTicket.getId();

        return UserTicketResponse.builder()
                .id(userTicket.getId())
                .eventId(event.getId())
                .eventTitle(event.getTitle())
                .eventDate(event.getEventDateTime())
                .eventLocation(eventLocation)
                .eventFlyerUrl(event.getFlyerUrl())
                .ticketId(ticketTier.getId())
                .ticketType(ticketTier.getTicketType())
                .ticketTier(ticketTier.getTicketType())
                .quantity(userTicket.getQuantity())
                .purchaseDate(userTicket.getPurchaseDate())
                .purchasePrice(userTicket.getPurchasePrice())
                .subtotalPrice(userTicket.getSubtotalPrice() != null ? userTicket.getSubtotalPrice() : userTicket.getPurchasePrice())
                .serviceFee(userTicket.getServiceFee())
                .totalPrice(userTicket.getTotalPrice() != null ? userTicket.getTotalPrice() : userTicket.getPurchasePrice())
                .currency(resolvedCurrency)
                .status(userTicket.getStatus() != null ? userTicket.getStatus().toString() : "UNKNOWN")
                .qrCodeUrl(userTicket.getQrCodeUrl())
                .pdfUrl(userTicket.getPdfUrl())
                .validationCode(userTicket.getValidationCode())
                .paymentIntentId(userTicket.getPaymentIntentId())
                .stripeIntentId(userTicket.getPaymentIntentId())
                .buyerName(buyerName)
                .buyerEmail(buyerEmail)
                .ticketNumber(ticketNumber)
                .validated(userTicket.getStatus() == UserTicket.TicketStatus.USED)
                .event(eventResponse)
                .build();
    }

    /**
     * Build event location safely handling null values
     */
    /**
     * Get all tickets for a payment (when user buys multiple ticket types)
     */
    public List<UserTicketResponse> getTicketsByPaymentIntent(Long userId, String paymentIntentId) {
        log.info("Fetching all tickets for payment: {}, user: {}", paymentIntentId, userId);

        List<UserTicket> tickets = userTicketRepository.findByUserIdAndPaymentIntentId(userId, paymentIntentId);

        if (tickets.isEmpty()) {
            throw new IllegalArgumentException("No tickets found for this payment");
        }

        return tickets.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private String buildEventLocation(Event event) {
        if (event == null) {
            return "N/A";
        }

        StringBuilder location = new StringBuilder();

        if (event.getVenueAddress() != null && !event.getVenueAddress().isEmpty()) {
            location.append(event.getVenueAddress());
        }

        if (event.getCity() != null && !event.getCity().isEmpty()) {
            if (location.length() > 0) {
                location.append(", ");
            }
            location.append(event.getCity());
        }

        if (event.getCountry() != null && !event.getCountry().isEmpty()) {
            if (location.length() > 0) {
                location.append(", ");
            }
            location.append(event.getCountry());
        }

        return location.length() > 0 ? location.toString() : "N/A";
    }

    /**
     * Get recent tickets purchased for organizer's events
     */
    public List<UserTicketResponse> getRecentTicketsForOrganizer(Long organizerId, int limit) {
        log.info("Fetching recent {} tickets for organizer: {}", limit, organizerId);
        
        List<UserTicket> tickets = userTicketRepository.findRecentTicketsByOrganizerIdDesc(organizerId);
        
        // Limit the results
        return tickets.stream()
                .limit(limit)
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Validate ticket by validation code for organizer entry scanning
     */
    public UserTicketResponse validateTicketForOrganizer(Long organizerId, String ticketNumber) {
        if (ticketNumber == null || ticketNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Ticket number is required");
        }

        String resolvedTicketNumber = resolveTicketNumber(ticketNumber);

        UserTicket userTicket = userTicketRepository.findByValidationCodeIgnoreCase(resolvedTicketNumber)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        if (userTicket.getEvent() == null || userTicket.getEvent().getOrganizer() == null ||
                !organizerId.equals(userTicket.getEvent().getOrganizer().getId())) {
            throw new IllegalArgumentException("Ticket does not belong to your events");
        }

        if (userTicket.getStatus() == UserTicket.TicketStatus.USED) {
            throw new IllegalArgumentException("Ticket already validated");
        }

        if (userTicket.getStatus() != UserTicket.TicketStatus.ACTIVE) {
            throw new IllegalArgumentException("Ticket is not valid for entry");
        }

        userTicket.setStatus(UserTicket.TicketStatus.USED);
        UserTicket saved = userTicketRepository.save(userTicket);
        return convertToResponse(saved);
    }

    private String resolveTicketNumber(String rawTicketNumber) {
        String trimmed = rawTicketNumber.trim();

        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            int keyIndex = trimmed.indexOf("\"validation_code\"");
            if (keyIndex >= 0) {
                int colonIndex = trimmed.indexOf(':', keyIndex);
                int firstQuote = trimmed.indexOf('"', colonIndex + 1);
                int secondQuote = trimmed.indexOf('"', firstQuote + 1);
                if (colonIndex > -1 && firstQuote > -1 && secondQuote > firstQuote) {
                    return trimmed.substring(firstQuote + 1, secondQuote).trim();
                }
            }
        }

        return trimmed;
    }
}