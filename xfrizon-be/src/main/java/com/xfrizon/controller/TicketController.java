package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.TicketPurchaseRequest;
import com.xfrizon.dto.UserTicketResponse;
import com.xfrizon.service.TicketService;
import com.xfrizon.service.PdfGenerationService;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user-tickets")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class TicketController {

    private final TicketService ticketService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PdfGenerationService pdfGenerationService;

    /**
     * Record a ticket purchase after successful payment
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserTicketResponse>> purchaseTicket(
            @Valid @RequestBody TicketPurchaseRequest request,
            HttpServletRequest httpRequest) {
        try {
            log.info("Recording ticket purchase for event: {}", request.getEventId());

            Long userId = extractUserIdFromToken(httpRequest);
            UserTicketResponse response = ticketService.recordTicketPurchase(userId, request);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Ticket purchased successfully"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error purchasing ticket", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to purchase ticket: " + e.getMessage(), 500));
        }
    }

    /**
     * Get user's tickets (paginated)
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<UserTicketResponse>>> getUserTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {
        try {
            log.info("Fetching user tickets - page: {}, size: {}", page, size);

            Long userId = extractUserIdFromToken(httpRequest);
            Pageable pageable = PageRequest.of(page, size);
            Page<UserTicketResponse> tickets = ticketService.getUserTickets(userId, pageable);

            return ResponseEntity.ok()
                    .body(ApiResponse.success(tickets, "Tickets retrieved successfully"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error fetching user tickets", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch tickets: " + e.getMessage(), 500));
        }
    }

    /**
     * Get user's tickets (list)
     */
    @GetMapping("/list")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<UserTicketResponse>>> getUserTicketsList(
            HttpServletRequest httpRequest) {
        try {
            log.info("Fetching user tickets list");

            Long userId = extractUserIdFromToken(httpRequest);
            List<UserTicketResponse> tickets = ticketService.getUserTicketsList(userId);

            return ResponseEntity.ok()
                    .body(ApiResponse.success(tickets, "Tickets retrieved successfully"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error fetching user tickets", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch tickets: " + e.getMessage(), 500));
        }
    }

    /**
     * Get specific ticket
     */
    @GetMapping("/:ticketId")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserTicketResponse>> getTicket(
            @PathVariable("ticketId") Long ticketId,
            HttpServletRequest httpRequest) {
        try {
            log.info("Fetching ticket: {}", ticketId);

            Long userId = extractUserIdFromToken(httpRequest);
            UserTicketResponse ticket = ticketService.getTicket(ticketId, userId);

            return ResponseEntity.ok()
                    .body(ApiResponse.success(ticket, "Ticket retrieved successfully"));

        } catch (IllegalArgumentException e) {
            log.warn("Ticket not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Ticket not found", 404));
        } catch (Exception e) {
            log.error("Error fetching ticket", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch ticket: " + e.getMessage(), 500));
        }
    }

    /**
     * Download all tickets for a payment as single PDF
     */
    @GetMapping("/payment/{paymentIntentId}/download-pdf")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadPaymentTicketsPDF(
            @PathVariable(name = "paymentIntentId") String paymentIntentId,
            HttpServletRequest httpRequest) {
        try {
            log.info("Downloading all tickets for payment: {}", paymentIntentId);

            Long userId = extractUserIdFromToken(httpRequest);
            List<UserTicketResponse> tickets = ticketService.getTicketsByPaymentIntent(userId, paymentIntentId);

            if (tickets.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            // Generate combined PDF for all tickets
            byte[] pdfContent = pdfGenerationService.generateMultipleTicketsPDF(tickets);

            // Get event title from first ticket for filename
            String eventTitle = tickets.get(0).getEventTitle().replaceAll("[^a-zA-Z0-9-]", "-");
            String filename = tickets.size() > 1 ? 
                "tickets-" + eventTitle + ".pdf" : 
                "ticket-" + eventTitle + ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .body(pdfContent);

        } catch (IllegalArgumentException e) {
            log.warn("Tickets not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error downloading tickets PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download ticket as PDF
     */
    @GetMapping("/{ticketId}/download-pdf")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadTicketPDF(
            @PathVariable(name = "ticketId") Long ticketId,
            HttpServletRequest httpRequest) {
        try {
            log.info("Downloading ticket PDF: {}", ticketId);

            Long userId = extractUserIdFromToken(httpRequest);
            UserTicketResponse ticket = ticketService.getTicket(ticketId, userId);

            // Generate PDF
            byte[] pdfContent = pdfGenerationService.generateTicketPDF(ticket);

            // Return as PDF file
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"ticket-" + ticketId + ".pdf\"")
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .body(pdfContent);

        } catch (IllegalArgumentException e) {
            log.warn("Ticket not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error downloading ticket PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download ticket (legacy endpoint - returns PDF)
     */
    @GetMapping("/{ticketId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadTicket(
            @PathVariable(name = "ticketId") Long ticketId,
            HttpServletRequest httpRequest) {
        try {
            log.info("Downloading ticket: {}", ticketId);

            Long userId = extractUserIdFromToken(httpRequest);
            UserTicketResponse ticket = ticketService.getTicket(ticketId, userId);

            // Generate PDF
            byte[] pdfContent = pdfGenerationService.generateTicketPDF(ticket);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"ticket-" + ticketId + ".pdf\"")
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .body(pdfContent);

        } catch (IllegalArgumentException e) {
            log.warn("Ticket not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error downloading ticket", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Cancel ticket
     */
    @DeleteMapping("/{ticketId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserTicketResponse>> cancelTicket(
            @PathVariable(name = "ticketId") Long ticketId,
            HttpServletRequest httpRequest) {
        try {
            log.info("Cancelling ticket: {}", ticketId);

            Long userId = extractUserIdFromToken(httpRequest);
            UserTicketResponse response = ticketService.cancelTicket(ticketId, userId);

            return ResponseEntity.ok()
                    .body(ApiResponse.success(response, "Ticket cancelled successfully"));

        } catch (IllegalArgumentException e) {
            log.warn("Ticket not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Ticket not found", 404));
        } catch (Exception e) {
            log.error("Error cancelling ticket", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to cancel ticket: " + e.getMessage(), 500));
        }
    }

    /**
     * Extract user ID from JWT token
     */
    private Long extractUserIdFromToken(HttpServletRequest request) {
        String token = getTokenFromRequest(request);
        if (token != null) {
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new IllegalArgumentException("Invalid or missing token");
    }

    /**
     * Get JWT token from request header
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
