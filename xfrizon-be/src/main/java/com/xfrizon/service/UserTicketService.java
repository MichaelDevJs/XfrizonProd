package com.xfrizon.service;

import com.xfrizon.dto.UserTicketResponse;
import com.xfrizon.entity.UserTicket;
import com.xfrizon.repository.UserTicketRepository;
import com.xfrizon.repository.UserRepository;
import com.xfrizon.repository.EventRepository;
import com.xfrizon.repository.TicketTierRepository;
import com.xfrizon.entity.User;
import com.xfrizon.entity.Event;
import com.xfrizon.entity.TicketTier;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UserTicketService {
    private final UserTicketRepository userTicketRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final TicketTierRepository ticketTierRepository;

    public List<UserTicketResponse> getUserTickets(Long userId) {
        List<UserTicket> tickets = userTicketRepository.findByUserIdOrderByPurchaseDateDesc(userId);
        return tickets.stream().map(UserTicketResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public UserTicketResponse purchaseTicket(Long userId, com.xfrizon.dto.TicketPurchaseRequest request) {
        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        // Validate event exists
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        // Validate ticket tier exists
        TicketTier ticketTier = ticketTierRepository.findById(request.getTicketId())
                .orElseThrow(() -> new IllegalArgumentException("Ticket tier not found"));
        // Extra null checks and logging
        if (user == null) throw new IllegalStateException("User is null after lookup");
        if (event == null) throw new IllegalStateException("Event is null after lookup");
        if (ticketTier == null) throw new IllegalStateException("TicketTier is null after lookup");
        if (request.getQuantity() == null) throw new IllegalArgumentException("Quantity is null");
        if (request.getTotalPrice() == null) throw new IllegalArgumentException("Total price is null");
        if (request.getPaymentIntentId() == null) throw new IllegalArgumentException("PaymentIntentId is null");
        // Log all values
        System.out.println("[DEBUG] Creating UserTicket: userId=" + userId + ", eventId=" + event.getId() + ", ticketTierId=" + ticketTier.getId() + ", quantity=" + request.getQuantity() + ", totalPrice=" + request.getTotalPrice() + ", paymentIntentId=" + request.getPaymentIntentId());
        UserTicket ticket = UserTicket.builder()
                .user(user)
                .event(event)
                .ticketTier(ticketTier)
                .quantity(request.getQuantity())
                .purchasePrice(request.getTotalPrice())
                .paymentIntentId(request.getPaymentIntentId())
                .status(UserTicket.TicketStatus.ACTIVE)
                .build();
        ticket = userTicketRepository.save(ticket);
        return UserTicketResponse.fromEntity(ticket);
    }
}
