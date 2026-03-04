package com.xfrizon.service;

import com.xfrizon.dto.UserTicketResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class PdfGenerationService {

    public byte[] generateTicketPDF(UserTicketResponse ticket) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("Event: " + ticket.getEventTitle()));
            document.add(new Paragraph("Date: " + ticket.getEventDate()));
            document.add(new Paragraph("Location: " + ticket.getEventLocation()));
            document.add(new Paragraph("Ticket Type: " + ticket.getTicketType()));
            document.add(new Paragraph("Quantity: " + ticket.getQuantity()));
            document.add(new Paragraph("Purchase Price: " + ticket.getPurchasePrice()));
            document.add(new Paragraph("Ticket ID: " + ticket.getId()));
            document.add(new Paragraph("Status: " + ticket.getStatus()));
            document.add(new Paragraph("Payment Intent: " + ticket.getPaymentIntentId()));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating PDF: {}", e.getMessage());
            return new byte[0];
        }
    }

    public byte[] generateMultipleTicketsPDF(List<UserTicketResponse> tickets) {
        // Not implemented for brevity
        return new byte[0];
    }

    public byte[] generateReport() {
        // Not implemented for brevity
        return new byte[0];
    }
}

