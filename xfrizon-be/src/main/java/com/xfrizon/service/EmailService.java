package com.xfrizon.service;

import com.xfrizon.dto.UserTicketResponse;
import com.xfrizon.entity.User;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;

@Service
@AllArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    /**
     * Send ticket confirmation email
     */
    public void sendTicketConfirmationEmail(UserTicketResponse ticket, User user) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String to = user.getEmail();
            helper.setTo(to);
            helper.setFrom("noreply@xfrizon.com");
            helper.setSubject("Your Xfrizon Ticket - " + ticket.getEvent().getTitle());

            // Build email content
            String htmlContent = buildTicketEmailContent(ticket, user);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Ticket confirmation email sent to: {}", to);

        } catch (MessagingException e) {
            log.error("Error sending ticket confirmation email to: {}", user.getEmail(), e);
            // Don't throw exception - email failure shouldn't block ticket purchase
        } catch (Exception e) {
            log.error("Error sending ticket confirmation email", e);
        }
    }

    /**
     * Send payment confirmation email
     */
    public void sendPaymentConfirmationEmail(User user, double amount, String eventTitle) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setFrom("noreply@xfrizon.com");
            message.setSubject("Payment Confirmation - Xfrizon");
            message.setText(buildPaymentConfirmationContent(user.getFirstName(), eventTitle, amount));

            mailSender.send(message);
            log.info("Payment confirmation email sent to: {}", user.getEmail());

        } catch (Exception e) {
            log.error("Error sending payment confirmation email to: {}", user.getEmail(), e);
        }
    }

    /**
     * Build HTML content for ticket confirmation email
     */
    private String buildTicketEmailContent(UserTicketResponse ticket, User user) {
        StringBuilder html = new StringBuilder();
        html.append("<html><body style='font-family: Arial, sans-serif; color: #333;'>");
        html.append("<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>");

        // Header
        html.append("<div style='text-align: center; margin-bottom: 30px;'>");
        html.append("<h1 style='color: #d33; margin: 0;'>Xfrizon</h1>");
        html.append("<h2 style='color: #666; margin: 10px 0;'>Your Ticket is Confirmed!</h2>");
        html.append("</div>");

        // Greeting
        html.append("<p>Hi ").append(user.getFirstName()).append(",</p>");
        html.append("<p>Thank you for your purchase! Your ticket for <strong>")
                .append(ticket.getEventTitle())
                .append("</strong> is now confirmed.</p>");

        // Event Details
        html.append("<div style='background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;'>");
        html.append("<h3>Event Details:</h3>");
        html.append("<table style='width: 100%; border-collapse: collapse;'>");
        html.append("<tr><td style='padding: 5px;'><strong>Event:</strong></td><td>")
                .append(ticket.getEventTitle()).append("</td></tr>");
        html.append("<tr><td style='padding: 5px;'><strong>Venue:</strong></td><td>")
                .append(ticket.getEventLocation()).append("</td></tr>");
        html.append("<tr><td style='padding: 5px;'><strong>Date & Time:</strong></td><td>")
                .append(ticket.getEventDate().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy HH:mm")))
                .append("</td></tr>");
        html.append("<tr><td style='padding: 5px;'><strong>Ticket Type:</strong></td><td>")
                .append(ticket.getTicketType()).append("</td></tr>");
        html.append("<tr><td style='padding: 5px;'><strong>Quantity:</strong></td><td>")
                .append(ticket.getQuantity()).append("</td></tr>");
        html.append("<tr><td style='padding: 5px;'><strong>Price:</strong></td><td>$")
                .append(String.format("%.2f", ticket.getPurchasePrice())).append("</td></tr>");
        html.append("</table>");
        html.append("</div>");

        // Ticket Information
        html.append("<div style='background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;'>");
        html.append("<h3>Ticket Information:</h3>");
        html.append("<p><strong>Validation Code:</strong> <code style='background-color: #f0f0f0; padding: 5px;'>")
                .append(ticket.getValidationCode()).append("</code></p>");
        html.append("<p><strong>Ticket ID:</strong> ").append(ticket.getId()).append("</p>");

        if (ticket.getQrCodeUrl() != null && !ticket.getQrCodeUrl().isEmpty()) {
            html.append("<p><strong>QR Code:</strong></p>");
            html.append("<img src='").append(ticket.getQrCodeUrl())
                    .append("' alt='Ticket QR Code' style='width: 200px; height: 200px; border: 2px solid #d33;'/>");
        }
        html.append("</div>");

        // Instructions
        html.append("<div style='margin: 20px 0;'>");
        html.append("<h3>What's Next?</h3>");
        html.append("<ol>");
        html.append("<li>Download your ticket as PDF from your Xfrizon account</li>");
        html.append("<li>Show the QR code at the event entrance for verification</li>");
        html.append("<li>Keep your validation code safe for reference</li>");
        html.append("</ol>");
        html.append("</div>");

        // Support
        html.append("<div style='border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;'>");
        html.append("<p style='color: #666; font-size: 12px;'>If you have any questions, please contact our support team at support@xfrizon.com</p>");
        html.append("<p style='color: #666; font-size: 12px; margin: 0;'>© 2026 Xfrizon. All rights reserved.</p>");
        html.append("</div>");

        html.append("</div></body></html>");
        return html.toString();
    }

    /**
     * Build payment confirmation email content
     */
    private String buildPaymentConfirmationContent(String firstName, String eventTitle, double amount) {
        return String.format(
                "Hi %s,\n\n" +
                        "Your payment for %s has been successfully processed.\n\n" +
                        "Amount: $%.2f\n\n" +
                        "You will receive a separate email with your ticket details and QR code shortly.\n\n" +
                        "Thank you for your purchase!\n\n" +
                        "Best regards,\n" +
                        "The Xfrizon Team",
                firstName != null ? firstName : "Guest",
                eventTitle != null ? eventTitle : "your event",
                amount
        );
    }

    /**
     * Send order confirmation email
     */
    public void sendOrderConfirmationEmail(User user, String eventTitle, int ticketCount, double totalAmount) {
        try {
            if (user == null || user.getEmail() == null) {
                log.warn("Cannot send order confirmation email: user is null");
                return;
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setFrom("noreply@xfrizon.com");
            message.setSubject("Order Confirmation - Xfrizon");

            StringBuilder content = new StringBuilder();
            content.append("Hi ").append(user.getFirstName() != null ? user.getFirstName() : "Guest").append(",\n\n");
            content.append("Your order for ").append(eventTitle != null ? eventTitle : "your event").append(" has been confirmed.\n\n");
            content.append("Tickets: ").append(ticketCount).append("\n");
            content.append("Total Amount: $").append(String.format("%.2f", totalAmount)).append("\n\n");
            content.append("You will receive ticket details shortly.\n\n");
            content.append("Thank you for your purchase!\n\n");
            content.append("Best regards,\n");
            content.append("The Xfrizon Team");

            message.setText(content.toString());
            mailSender.send(message);

            log.info("Order confirmation email sent to: {}", user.getEmail());

        } catch (Exception e) {
            log.error("Error sending order confirmation email to: {}", user != null ? user.getEmail() : "unknown", e);
        }
    }
}
