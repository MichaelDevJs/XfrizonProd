# Xfrizon Backend API - Event Management System

A comprehensive, enterprise-grade backend API for managing events, tickets, and organizer operations.

## 🎯 Features

### Event Management

- ✅ **Create Events**: Full event creation with multi-tier ticket support
- ✅ **Manage Events**: Edit, publish, cancel, and delete events
- ✅ **Status Tracking**: Track event lifecycle (DRAFT → PUBLISHED → LIVE → COMPLETED)
- ✅ **Multi-Currency Support**: Support for 10+ currencies (NGN, USD, GBP, EUR, KES, ZAR, GHS, CAD, INR, UGX)
- ✅ **Ticket Tiers**: Create flexible pricing tiers with quantity limits
- ✅ **Organizer Authorization**: Secure endpoints with role-based access

### Authentication & Security

- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Role-Based Access**: User vs Organizer roles
- ✅ **Event Authorization**: Organizers can only manage their own events
- ✅ **Input Validation**: Comprehensive validation on all inputs
- ✅ **Global Exception Handling**: Consistent error responses

---

## 🚀 Quick Start

### Prerequisites

- Java 17+
- MySQL 8.0+
- Maven 3.8+

### Installation

```bash
# 1. Create database
mysql -u root -p
> CREATE DATABASE xfrizon_ts CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 2. Update application.properties with your database credentials

# 3. Build and run
mvn clean package
mvn spring-boot:run

# 4. Verify
curl http://localhost:8081/api/v1/events/public/upcoming?page=0&size=10
```

---

## 📋 API Endpoints

### Event Management (Requires JWT)

```
POST   /api/v1/events                          - Create event
GET    /api/v1/events                          - Get organizer events
GET    /api/v1/events/{id}                     - Get event details
PUT    /api/v1/events/{id}                     - Update event
POST   /api/v1/events/{id}/publish             - Publish event
POST   /api/v1/events/{id}/cancel              - Cancel event
DELETE /api/v1/events/{id}                     - Delete event
GET    /api/v1/events/dashboard/stats          - Get dashboard stats
```

### Public Events

```
GET /api/v1/events/public/upcoming          - Get upcoming events
GET /api/v1/events/public/country/{country} - Get events by country
```

---

## 📊 Database

Run the migration script:

```sql
-- src/main/resources/sql/001_create_event_tables.sql
```

Tables created:

- `events` - Main event records
- `ticket_tiers` - Ticket pricing tiers
- `event_genres` - Event categories
- `audit_logs` - Change tracking

---

## 🔐 Security

- JWT token-based authentication
- Role-based access control (USER, ORGANIZER, ADMIN)
- Resource ownership verification
- Comprehensive input validation

---

## 📚 Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Setup Guide](./SETUP_GUIDE.md) - Deployment instructions

---

## 🛠️ Tech Stack

- Spring Boot 3.1.0
- Java 17
- MySQL 8.0
- JWT (JJWT)
- Hibernate/JPA
- Maven

---

**Status:** Production Ready ✅

## Tests

```powershell
.\mvnw.cmd -Dtest=EventServiceTest test
.\mvnw.cmd -Dtest=EventControllerIT test
```
