package com.xfrizon.controller;

import com.xfrizon.dto.ApiResponse;
import com.xfrizon.dto.UserTicketResponse;
import com.xfrizon.service.TicketService;
import com.xfrizon.service.PdfGenerationService;
import com.xfrizon.util.JwtTokenProvider;
import jakarta.annotation.Nullable;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user-tickets")
@AllArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserTicketController {

    private final TicketService ticketService;
    private final PdfGenerationService pdfGenerationService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public @Nullable ResponseEntity<ApiResponse<List<UserTicketResponse>>> getUserTickets(HttpServletRequest request) {
        try {
            Long userId = extractUserIdFromToken(request);
            List<UserTicketResponse> tickets = ticketService.getUserTicketsList(userId);
            return ResponseEntity.ok(ApiResponse.success(tickets, "User tickets fetched successfully"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid token when fetching user tickets: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error fetching user tickets", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch user tickets: " + e.getMessage(), 500));
        }
    }

    @GetMapping("/list")
    @PreAuthorize("isAuthenticated()")
    public @Nullable ResponseEntity<ApiResponse<List<UserTicketResponse>>> getUserTicketsList(HttpServletRequest request) {
        return getUserTickets(request);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserTicketResponse>> purchaseTicket(
            @RequestBody com.xfrizon.dto.TicketPurchaseRequest request,
            HttpServletRequest httpRequest) {
        try {
            Long userId = extractUserIdFromToken(httpRequest);
            UserTicketResponse ticket = ticketService.recordTicketPurchase(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(ticket, "Ticket purchased successfully"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid ticket purchase request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage(), 400));
        } catch (Exception e) {
            log.error("Error purchasing ticket", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to purchase ticket: " + e.getMessage(), 500));
        }
    }

    @GetMapping("/{ticketId}/download-pdf")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadTicketPdf(@PathVariable Long ticketId, HttpServletRequest request) {
        try {
            Long userId = extractUserIdFromToken(request);
            UserTicketResponse ticket = ticketService.getTicket(ticketId, userId);
            if (ticket == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }
            byte[] pdfBytes = pdfGenerationService.generateTicketPDF(ticket);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "attachment; filename=Ticket-" + ticketId + ".pdf")
                    .body(pdfBytes);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid token when downloading ticket PDF: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            log.error("Error generating PDF for ticket {}: {}", ticketId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    private Long extractUserIdFromToken(HttpServletRequest request) {
        String token = getTokenFromRequest(request);
        if (token != null) {
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new IllegalArgumentException("Invalid or missing token");
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
