# Xfrizon Event Management API Documentation

## Overview

Enterprise-grade event management system built with Spring Boot, MySQL, and JWT authentication.

## Base URL

```
http://localhost:8081/api/v1
```

## Authentication

All protected endpoints require JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

---

## Event Management Endpoints

### 1. Create Event

**POST** `/events`

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "title": "Amazing Concert 2026",
  "description": "A night of incredible music",
  "eventDateTime": "2026-03-15T19:00:00",
  "venueName": "National Stadium",
  "venueAddress": "Lagos, Nigeria",
  "venueMapLink": "https://maps.google.com/...",
  "country": "Nigeria",
  "currency": "NGN",
  "ageLimit": 18,
  "capacity": 5000,
  "genres": ["Music", "Concert", "Live Entertainment"],
  "tickets": [
    {
      "ticketType": "Early Bird",
      "currency": "NGN",
      "price": 5000,
      "quantity": 1000,
      "maxPerPerson": 10,
      "priceEnds": "2026-02-15T23:59:59",
      "description": "Limited early bird pricing"
    },
    {
      "ticketType": "Regular",
      "currency": "NGN",
      "price": 7500,
      "quantity": 2000,
      "maxPerPerson": 10,
      "priceEnds": null,
      "description": "Regular admission"
    }
  ]
}
```

**Success Response (201 Created):**

```json
{
  "id": 1,
  "title": "Amazing Concert 2026",
  "description": "A night of incredible music",
  "eventDateTime": "2026-03-15T19:00:00",
  "venueName": "National Stadium",
  "venueAddress": "Lagos, Nigeria",
  "country": "Nigeria",
  "currency": "NGN",
  "status": "DRAFT",
  "ageLimit": 18,
  "capacity": 5000,
  "totalRevenue": 0,
  "totalTicketsSold": 0,
  "genres": ["Music", "Concert", "Live Entertainment"],
  "ticketTiers": [
    {
      "id": 1,
      "ticketType": "Early Bird",
      "currency": "NGN",
      "price": 5000,
      "quantity": 1000,
      "quantitySold": 0,
      "maxPerPerson": 10,
      "saleEndsAt": "2026-02-15T23:59:59",
      "status": "ACTIVE",
      "description": "Limited early bird pricing"
    }
  ],
  "createdAt": "2026-02-20T10:30:00",
  "publishedAt": null
}
```

### 2. Get Event

**GET** `/events/{eventId}`

**Headers:**

- `Authorization: Bearer <token>`

**Success Response (200 OK):**

```json
{
  "id": 1,
  "title": "Amazing Concert 2026",
  "status": "DRAFT",
  "ticketTiers": [...]
}
```

### 3. Get All Organizer Events

**GET** `/events?page=0&size=20&sort=createdAt,desc`

**Headers:**

- `Authorization: Bearer <token>`

**Success Response (200 OK):**

```json
{
  "content": [
    {
      "id": 1,
      "title": "Amazing Concert 2026",
      "status": "DRAFT"
    }
  ],
  "pageable": {...},
  "totalElements": 1,
  "totalPages": 1
}
```

### 4. Update Event

**PUT** `/events/{eventId}`

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:** Same as Create Event

**Success Response (200 OK):** Updated event object

**Note:** Only DRAFT events can be updated

### 5. Publish Event

**POST** `/events/{eventId}/publish`

**Headers:**

- `Authorization: Bearer <token>`

**Success Response (200 OK):**

```json
{
  "id": 1,
  "status": "PUBLISHED",
  "publishedAt": "2026-02-20T10:35:00",
  ...
}
```

### 6. Cancel Event

**POST** `/events/{eventId}/cancel?reason=Weather conditions`

**Headers:**

- `Authorization: Bearer <token>`

**Query Parameters:**

- `reason` (optional): Reason for cancellation

**Success Response (200 OK):**

```json
{
  "id": 1,
  "status": "CANCELLED",
  "cancelledAt": "2026-02-20T10:36:00",
  "cancellableReason": "Weather conditions"
}
```

### 7. Delete Event

**DELETE** `/events/{eventId}`

**Headers:**

- `Authorization: Bearer <token>`

**Success Response (204 No Content)**

**Note:** Only DRAFT events can be deleted

### 8. Get Organizer Dashboard Stats

**GET** `/events/dashboard/stats`

**Headers:**

- `Authorization: Bearer <token>`

**Success Response (200 OK):**

```json
{
  "draftCount": 2,
  "publishedCount": 5,
  "liveCount": 1,
  "completedCount": 10,
  "totalCount": 18
}
```

---

## Public Event Endpoints

### 1. Get Upcoming Events

**GET** `/events/public/upcoming?page=0&size=20`

**Success Response (200 OK):**

```json
{
  "content": [
    {
      "id": 1,
      "title": "Amazing Concert 2026",
      "status": "PUBLISHED",
      "eventDateTime": "2026-03-15T19:00:00"
    }
  ],
  "totalElements": 45,
  "totalPages": 3
}
```

### 2. Get Events by Country

**GET** `/events/public/country/{country}?page=0&size=20`

**Path Parameters:**

- `country`: Country name (e.g., "Nigeria", "Kenya")

**Success Response (200 OK):** List of events in that country

---

## Event Status Flow

```
DRAFT → PUBLISHED → LIVE → COMPLETED
  ↓
  CANCELLED

POSTPONED (interim state)
```

### Status Descriptions:

- **DRAFT**: Event is being created, not yet visible to public
- **PUBLISHED**: Event is live on platform, accepting registrations
- **LIVE**: Event is currently happening
- **COMPLETED**: Event has finished
- **CANCELLED**: Event was cancelled
- **POSTPONED**: Event rescheduled

---

## Error Handling

### Common Error Responses:

**400 Bad Request:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": "Title is required",
    "eventDateTime": "Event date must be in future"
  },
  "timestamp": "2026-02-20T10:30:00"
}
```

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Invalid or missing token",
  "timestamp": "2026-02-20T10:30:00"
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "message": "Event not found or unauthorized access",
  "timestamp": "2026-02-20T10:30:00"
}
```

**409 Conflict:**

```json
{
  "success": false,
  "message": "Only DRAFT events can be updated",
  "timestamp": "2026-02-20T10:30:00"
}
```

---

## Database Schema

### Events Table

| Column             | Type          | Constraint         |
| ------------------ | ------------- | ------------------ |
| id                 | BIGINT        | PK, AUTO_INCREMENT |
| organizer_id       | BIGINT        | FK to users.id     |
| title              | VARCHAR(255)  | NOT NULL           |
| description        | LONGTEXT      |                    |
| event_date_time    | DATETIME      | NOT NULL           |
| venueName          | VARCHAR(255)  | NOT NULL           |
| venueAddress       | VARCHAR(500)  |                    |
| country            | VARCHAR(100)  | NOT NULL           |
| currency           | VARCHAR(10)   | DEFAULT 'NGN'      |
| status             | ENUM          | DEFAULT 'DRAFT'    |
| total_capacity     | DECIMAL(19,2) |                    |
| total_tickets_sold | INT           |                    |
| total_revenue      | DECIMAL(19,2) |                    |
| created_at         | DATETIME      | NOT NULL           |
| updated_at         | DATETIME      | NOT NULL           |
| published_at       | DATETIME      |                    |
| cancelled_at       | DATETIME      |                    |

### Ticket Tiers Table

| Column        | Type          | Constraint         |
| ------------- | ------------- | ------------------ |
| id            | BIGINT        | PK, AUTO_INCREMENT |
| event_id      | BIGINT        | FK to events.id    |
| ticketType    | VARCHAR(100)  | NOT NULL           |
| currency      | VARCHAR(10)   | NOT NULL           |
| price         | DECIMAL(19,2) | NOT NULL           |
| quantity      | INT           |                    |
| quantity_sold | INT           | DEFAULT 0          |
| maxPerPerson  | INT           | DEFAULT 1          |
| saleEndsAt    | DATETIME      |                    |
| status        | ENUM          | DEFAULT 'ACTIVE'   |
| created_at    | DATETIME      | NOT NULL           |
| updated_at    | DATETIME      | NOT NULL           |

---

## Validation Rules

### Event Creation:

- **title**: Required, max 255 characters
- **eventDateTime**: Required, must be future date
- **venueName**: Required, max 255 characters
- **country**: Required
- **currency**: Required, must be valid currency code
- **tickets**: At least one ticket tier required
  - Each ticket must have: ticketType, currency, price
  - price: Must be > 0
  - maxPerPerson: Must be > 0

### Ticket Validation:

- Price must be positive
- Quantity must be positive if specified
- Max per person must be at least 1
- Sale end date must be after creation date if specified

---

## Rate Limiting

Currently no rate limiting. Implement if needed per environment.

## CORS Configuration

- Allowed Origins: All (\*)
- Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
- Max Age: 3600 seconds

---

## Example cURL Commands

### Create Event:

```bash
curl -X POST http://localhost:8081/api/v1/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Conference 2026",
    "description": "Annual tech conference",
    "eventDateTime": "2026-03-15T09:00:00",
    "venueName": "Convention Center",
    "venueAddress": "Lagos, Nigeria",
    "country": "Nigeria",
    "currency": "NGN",
    "tickets": [{
      "ticketType": "Early Bird",
      "currency": "NGN",
      "price": 10000,
      "quantity": 500
    }]
  }'
```

### Publish Event:

```bash
curl -X POST http://localhost:8081/api/v1/events/1/publish \
  -H "Authorization: Bearer <token>"
```

### Get Upcoming Events:

```bash
curl -X GET "http://localhost:8081/api/v1/events/public/upcoming?page=0&size=10"
```

---

## Version History

- **v1.0** (2026-02-20): Initial release with event creation, publishing, and management
