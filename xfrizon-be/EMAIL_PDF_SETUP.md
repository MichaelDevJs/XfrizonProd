# Payment System - Email & PDF Setup Guide

## Overview

This guide explains how to set up the email notification system and PDF ticket generation for the Xfrizon ticketing system.

## Components Added

### 1. **PdfGenerationService.java**

- Generates PDF tickets with event details, QR codes, and validation codes
- Uses iText 8.0.4 for PDF generation
- Uses ZXing for QR code generation
- Stores generated PDF in memory (ByteArrayOutputStream)

### 2. **EmailService.java**

- Sends ticket confirmation emails with formatted HTML
- Sends payment confirmation emails
- Sends order confirmation emails
- Can be extended for additional email types

### 3. **TicketController.java Updates**

- New endpoint: `GET /user-tickets/{ticketId}/download-pdf`
- Downloads ticket as PDF file
- Requires authentication (JWT token in header)
- Returns `application/pdf` with inline attachment

### 4. **Dependencies Added to pom.xml**

```xml
<!-- PDF Generation -->
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itext-core</artifactId>
    <version>8.0.4</version>
</dependency>

<!-- QR Code Generation -->
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>core</artifactId>
    <version>3.5.2</version>
</dependency>
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>javase</artifactId>
    <version>3.5.2</version>
</dependency>

<!-- Email Support -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>

<!-- Email Templates -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-freemarker</artifactId>
</dependency>
```

## Email Configuration

### Step 1: Update application.properties

Add the following email configuration:

```properties
# Email Configuration (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=5000
spring.mail.properties.mail.smtp.writetimeout=5000

# Freemarker Configuration for Email Templates
spring.freemarker.template-loader-path=classpath:/templates/
spring.freemarker.suffix=.ftl
spring.freemarker.cache=false
spring.freemarker.charset=UTF-8
```

### Step 2: Setup Gmail SMTP

If using Gmail:

1. Enable 2-Factor Authentication on your Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer" (or your device)
4. Generate an app password
5. Use this password in `spring.mail.password` (NOT your Gmail password)

### Step 3: Alternative - Office 365/Outlook

```properties
spring.mail.host=smtp.office365.com
spring.mail.port=587
spring.mail.username=your-email@company.com
spring.mail.password=your-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
```

### Step 4: Alternative - Custom SMTP Server

```properties
spring.mail.host=your-smtp-server.com
spring.mail.port=587  # or 465 for SSL
spring.mail.username=your-username
spring.mail.password=your-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

## Integration with TicketService

To send emails after ticket purchase, update `TicketService.java`:

```java
@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class TicketService {

    private final UserTicketRepository userTicketRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final TicketTierRepository ticketTierRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final EmailService emailService;  // Add this
    private final PdfGenerationService pdfGenerationService;  // Add this

    public UserTicketResponse recordTicketPurchase(Long userId, TicketPurchaseRequest request) {
        // ... existing code ...

        UserTicketResponse response = entityToResponse(userTicket);

        // Send confirmation email
        try {
            emailService.sendTicketConfirmationEmail(response, user);
        } catch (Exception e) {
            log.warn("Failed to send confirmation email for ticket {}", userTicket.getId(), e);
            // Don't fail the purchase if email fails
        }

        return response;
    }
}
```

## PDF Download Flow

### Frontend (PaymentSuccessPage.jsx)

```jsx
const downloadPDF = async () => {
  try {
    if (!ticketData) return;

    const response = await api.get(
      `/user-tickets/${ticketData.id}/download-pdf`,
      {
        responseType: "blob",
      },
    );

    // Create blob link and download
    const link = document.createElement("a");
    const url = window.URL.createObjectURL(response.data);
    link.href = url;
    link.download = `ticket-${ticketData.event?.title || "event"}.pdf`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);

    toast.success("Ticket downloaded successfully!");
  } catch (error) {
    console.error("Error downloading PDF:", error);
    toast.error("Failed to download ticket");
  }
};
```

### Backend Flow (TicketController.java)

1. GET `/user-tickets/{ticketId}/download-pdf`
2. Extract user ID from JWT token
3. Fetch ticket (validates ownership)
4. Call `PdfGenerationService.generateTicketPDF(ticket)`
5. Return PDF as byte array with proper headers:
   - `Content-Type: application/pdf`
   - `Content-Disposition: attachment; filename="ticket-{id}.pdf"`

## Email Templates

The `EmailService` generates HTML emails with the following structure:

### Ticket Confirmation Email

- Event name and date
- Venue location
- Ticket type and quantity
- Purchase price
- Validation code
- embedded QR code
- Instructions for event entry

### Payment Confirmation Email

- Amount paid
- Event title
- Order confirmation
- Reference to ticket confirmation email

## Testing

### Test Email Sending

```bash
# Use Spring Boot test or create a simple endpoint to test:
POST /api/v1/test/send-email
{
  "email": "test@example.com",
  "eventName": "Concert 2026"
}
```

### Test PDF Generation

1. Purchase a ticket (should receive confirmation email)
2. Visit Payment Success page
3. Click "Download PDF Ticket"
4. Verify PDF downloads with correct ticket details and QR code

## Troubleshooting

### Email Not Sending

1. **Check SMTP Configuration**
   - Verify credentials in application.properties
   - Test connection: `telnet smtp.gmail.com 587`

2. **Gmail App Password Issues**
   - Ensure 2FA is enabled
   - Regenerate app password if needed
   - Don't use regular Gmail password

3. **Check Logs**

   ```
   logging.level.org.springframework.mail=DEBUG
   ```

4. **Firewall/Network**
   - Ensure port 587 (SMTP) is not blocked
   - Check firewall rules

### PDF Generation Issues

1. **Missing Dependencies**
   - Verify all Maven dependencies installed: `mvn clean install`
   - Check pom.xml has iText and ZXing entries

2. **Out of Memory**
   - For large PDFs: Increase heap size
   - `export MAVEN_OPTS="-Xmx2048m"`

3. **QR Code Not Generating**
   - Ensure validation code exists
   - Check ZXing library version compatibility

## Performance Considerations

1. **Email Sending**
   - Currently synchronous - consider making async with @Async
   - Implement email queue/retry logic for failures

2. **PDF Generation**
   - Generated on-demand (memory efficient)
   - Consider caching for high-traffic events
   - Monitor memory usage with large PDFs

3. **File Downloads**
   - Use streaming for large files
   - Set appropriate timeout values

## Future Enhancements

1. **Async Email Sending**

   ```java
   @Async
   public void sendTicketConfirmationEmailAsync(UserTicketResponse ticket, User user) {
       // Email sending code
   }
   ```

2. **Email Queue**
   - Add to message queue (RabbitMQ, Kafka)
   - Process asynchronously
   - Implement retry logic

3. **PDF Caching**
   - Cache generated PDFs temporarily
   - S3/Cloud storage integration

4. **Email Templates**
   - Move to Freemarker templates
   - Support multiple languages
   - Customizable branding

5. **Webhook Integration**
   - Send webhooks for payment events
   - Third-party notification services

## API Endpoints

### Download Ticket PDF

```
GET /api/v1/user-tickets/{ticketId}/download-pdf
Authorization: Bearer <JWT_TOKEN>

Response:
- Status: 200 OK
- Content-Type: application/pdf
- Body: PDF file bytes
```

### Get User Tickets (Paginated)

```
GET /api/v1/user-tickets?page=0&size=10
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "status": "success",
  "data": {
    "content": [...],
    "totalElements": 25,
    "totalPages": 3,
    "currentPage": 0
  }
}
```

### Get User Tickets (List)

```
GET /api/v1/user-tickets/list
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "eventId": 5,
      "ticketType": "VIP",
      "quantity": 2,
      "validationCode": "ABC123XYZ789",
      "qrCodeUrl": "data:image/png;base64,...",
      ...
    }
  ]
}
```

## Next Steps

1. Update `application.properties` with your email credentials
2. Test email sending with a test account
3. Update `TicketService.java` to call `emailService` after ticket purchase
4. Deploy and test complete payment flow
5. Monitor email delivery and PDF generation

## Support

For issues or questions:

1. Check application logs: `logging.level.com.xfrizon=DEBUG`
2. Enable SMTP debug: `spring.mail.properties.mail.debug=true`
3. Verify credentials are correct
4. Check network connectivity to SMTP server
