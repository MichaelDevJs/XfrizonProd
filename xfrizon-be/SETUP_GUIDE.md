# Xfrizon Backend Setup & Deployment Guide

## Quick Start

### Prerequisites
- Java 17+
- MySQL 8.0+
- Maven 3.8+
- Git

### 1. Database Setup

**Create Database:**
```sql
CREATE DATABASE xfrizon_ts 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE xfrizon_ts;
```

**Apply Migrations:**
```bash
# Run SQL migration from resources
# File: src/main/resources/sql/001_create_event_tables.sql
```

### 2. Backend Configuration

**Update `application.properties`:**

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/xfrizon_ts?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=your_password

# JWT Secret (change for production!)
jwt.secret=your-secret-key-min-256-bits-very-long-secret-key
jwt.expiration=86400000

# Server Port
server.port=8081
```

### 3. Build & Run

```bash
# Build project
mvn clean package

# Run application
mvn spring-boot:run

# Or run JAR directly
java -jar target/xfrizon-be-1.0.0.jar
```

**Expected Output:**
```
Started XfrizonApplication in X.XXX seconds
Server is running on port 8081
```

### 4. Verify Backend

```bash
# Check if backend is running
curl http://localhost:8081/api/v1/events/public/upcoming?page=0&size=10
```

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create user account
- `POST /api/v1/auth/register-organizer` - Create organizer account
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/user` - Get current user info
- `POST /api/v1/auth/validate-token` - Validate JWT token

### Event Management
- `POST /api/v1/events` - Create event
- `GET /api/v1/events` - Get organizer's events
- `GET /api/v1/events/{id}` - Get event details
- `PUT /api/v1/events/{id}` - Update event
- `POST /api/v1/events/{id}/publish` - Publish event
- `POST /api/v1/events/{id}/cancel` - Cancel event
- `DELETE /api/v1/events/{id}` - Delete event
- `GET /api/v1/events/dashboard/stats` - Get dashboard stats
- `GET /api/v1/events/public/upcoming` - Get upcoming events
- `GET /api/v1/events/public/country/{country}` - Get events by country

---

## Architecture Overview

### Layers

```
Controller Layer (EventController, AuthController)
      ↓
Service Layer (EventService, AuthService)
      ↓
Repository Layer (EventRepository, TicketTierRepository)
      ↓
Entity Layer (Event, TicketTier, User)
      ↓
Database (MySQL)
```

### Entity Relationships

```
User (1) ──── (Many) Event
Event (1) ──── (Many) TicketTier
Event (1) ──── (Many) EventGenres
```

### Key Components

**Event.java**
- Main event entity
- Status: DRAFT, PUBLISHED, LIVE, COMPLETED, CANCELLED, POSTPONED
- Relations: Organizer (User), TicketTiers, Genres

**TicketTier.java**
- Ticket pricing tiers
- Status: ACTIVE, SOLD_OUT, ENDED, INACTIVE
- Supports multiple currencies

**EventService.java**
- Business logic for event management
- Handles creation, updates, publishing, cancellation
- Organizer authorization checks

**EventController.java**
- REST endpoints for event operations
- JWT token extraction and validation
- Pagination support

---

## Database Indexes

Optimized queries with indexes on:
- `idx_organizer_id` - Fast lookup of organizer's events
- `idx_event_status` - Fast filtering by status
- `idx_event_date` - Fast sorting by date
- `idx_entity_audit` - Fast audit log lookups

---

## Error Handling

### Global Exception Handler
- `GlobalExceptionHandler.java`
- Handles: Validation errors, Illegal arguments, Illegal states
- Returns: Consistent error response format with timestamp

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": {},
  "timestamp": "2026-02-20T10:30:00"
}
```

---

## Security

### JWT Implementation
- **Algorithm**: HS512 (HMAC SHA-512)
- **Expiration**: 24 hours (configurable)
- **User ID**: Embedded in token claims

### CORS Configuration
- Allowed Origins: All (*)
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Credentials: Allowed

### Authorization Checks
- Verify user is ORGANIZER role to create events
- Verify organizer owns event before update/delete
- Verify JWT token validity on protected endpoints

---

## Performance Optimization

### Database Optimizations
- Connection pooling (Hikari)
- Batch inserts (10 records per batch)
- Order inserts/updates for better transaction performance
- Strategic indexes on commonly filtered columns

### Query Optimization
- Lazy loading for relationships
- Custom JPQL queries with @Query annotations
- Pagination for large result sets

### Caching (Future)
- Redis for event listings
- Cache organizer dashboard stats
- Invalidate on event updates

---

## Monitoring & Logging

### Logging Levels
```properties
logging.level.com.xfrizon=DEBUG
logging.level.org.springframework.web=INFO
logging.level.org.hibernate.SQL=DEBUG
```

### Key Logs
- Event creation/updates
- Authorization failures
- Database errors
- Transaction rollbacks

---

## Transaction Management

### Transactional Services
- `@Transactional` on service methods
- Automatic rollback on exceptions
- Isolation level: DEFAULT (READ_COMMITTED in MySQL)

---

## Deployment Checklist

### Before Production:

- [ ] Update JWT secret in `application.properties`
- [ ] Set `spring.jpa.show-sql=false` for performance
- [ ] Update database credentials
- [ ] Configure production MySQL server
- [ ] Set up SSL/TLS certificates
- [ ] Review CORS settings (restrict origins)
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy for MySQL
- [ ] Set up CI/CD pipeline
- [ ] Load testing with production data

### Environment-Specific Configs:

**Development:**
```properties
spring.jpa.show-sql=true
logging.level.com.xfrizon=DEBUG
```

**Production:**
```properties
spring.jpa.show-sql=false
logging.level.com.xfrizon=INFO
spring.datasource.hikari.maximum-pool-size=20
jwt.expiration=43200000
```

---

## Troubleshooting

### Issue: Database Connection Failed
```
Error: Unable to connect to MySQL
```
**Solution:**
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `application.properties`
- Check firewall rules
- Verify database exists: `SHOW DATABASES;`

### Issue: JWT Token Invalid
```
Error: Invalid or missing token
```
**Solution:**
- Ensure token is sent in Authorization header
- Format: `Bearer <token>`
- Check token hasn't expired
- Verify JWT secret matches

### Issue: Event Creation Fails with 400
```
Error: Validation failed
```
**Solution:**
- Verify all required fields are provided
- Check eventDateTime is ISO format: `YYYY-MM-DDTHH:MM:SS`
- Verify at least one ticket tier is provided
- Check ticket price is positive

### Issue: Port 8081 Already in Use
```
Error: Port 8081 already in use
```
**Solution:**
- Kill process on port: `lsof -ti:8081 | xargs kill -9`
- Or change port: `server.port=8082` in `application.properties`

---

## Development Tips

### Hot Reload
Use Spring DevTools for development:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
</dependency>
```

### IDE Setup (IntelliJ)
1. Open project as Maven project
2. Mark `src/main/java` as Sources Root
3. Mark `src/test/java` as Test Sources Root
4. Configure JDK 17 in project settings
5. Run `XfrizonApplication` class directly

### Testing API Endpoints
Use Postman or cURL:
```bash
# Create event
POST http://localhost:8081/api/v1/events
Header: Authorization: Bearer <token>
Body: {...event data...}

# Get upcoming events
GET http://localhost:8081/api/v1/events/public/upcoming?page=0&size=10
```

---

## Next Steps

1. **File Upload Service**: Implement S3 integration for flyer storage
2. **Payment Integration**: Add payment processing for ticket sales
3. **Email Service**: Email confirmations for event registration
4. **Search & Analytics**: Elasticsearch for event search
5. **WebSockets**: Real-time event updates
6. **Message Queue**: Kafka for async event processing

---

## Support

For issues or questions:
1. Check this documentation
2. Review API_DOCUMENTATION.md
3. Check database migrations
4. Review application logs
5. Check Spring Boot documentation

---

**Last Updated:** 2026-02-20
**Version:** 1.0.0
