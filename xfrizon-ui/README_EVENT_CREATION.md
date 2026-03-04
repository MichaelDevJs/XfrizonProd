# Event Creation System - Complete Guide

## 🎯 Overview

The event creation system is a comprehensive solution enabling organizers to create, configure, and publish events with multi-tier ticket support. The system is fully integrated between frontend and backend with real-time preview capabilities.

---

## 📊 Architecture

### Frontend Components

#### CreateEvent.jsx

- **Location**: `src/pages/organizer/CreateEvent.jsx`
- **Size**: ~720 lines
- **Purpose**: Main event creation form interface
- **Key Features**:
  - Real-time ticket preview
  - Image cropping tool
  - Date/time split pickers
  - Country autocomplete
  - Multi-tier ticket support
  - Form validation with toast notifications

#### TicketPreview.jsx

- **Location**: `src/component/organizer/TicketPreview.jsx`
- **Size**: ~100 lines
- **Purpose**: Live ticket preview card
- **Features**:
  - Dynamic currency symbol mapping (₦, $, £, €, KSh, R, GH₵, C$, ₹, UGX)
  - Real-time updates as form changes
  - Formatted date/time display
  - Line-clamped event names

### Backend Components

#### Event Entity

- **Location**: `src/main/java/com/xfrizon/entity/Event.java`
- **Relationships**: OneToMany with TicketTier, ManyToOne with User (organizer)
- **Status Types**: DRAFT, PUBLISHED, LIVE, COMPLETED, CANCELLED, POSTPONED
- **Indexes**: organizer_id, status, eventDateTime
- **Columns**: 20+ fields including metadata, timestamps, audit info

#### TicketTier Entity

- **Location**: `src/main/java/com/xfrizon/entity/TicketTier.java`
- **Relationships**: ManyToOne with Event
- **Status Types**: ACTIVE, SOLD_OUT, ENDED, INACTIVE
- **Columns**: Ticket type, price, quantity, currency, sale limits

#### EventService

- **Location**: `src/main/java/com/xfrizon/service/EventService.java`
- **Size**: ~250 lines
- **Methods**:
  - `createEvent()` - Create event with ticket tiers
  - `publishEvent()` - Publish DRAFT → PUBLISHED
  - `updateEvent()` - Update event details
  - `cancelEvent()` - Cancel event
  - `deleteEvent()` - Delete DRAFT events
  - `getOrganizerEvents()` - Paginated organizer events
  - `getUpcomingEvents()` - Public upcoming events
  - `getEventsByCountry()` - Filter by location

#### EventController

- **Location**: `src/main/java/com/xfrizon/controller/EventController.java`
- **Size**: ~180 lines
- **Endpoints**: 10 REST endpoints for event management

#### Database Migration

- **Location**: `src/main/resources/sql/001_create_event_tables.sql`
- **Tables**:
  - `events` - Main event records
  - `ticket_tiers` - Ticket pricing
  - `event_genres` - Categories
  - `audit_logs` - Change tracking

---

## 🔄 Event Creation Flow

### Step 1: User Fills Form

```javascript
// CreateEvent.jsx
const [form, setForm] = useState({
  title: "",
  description: "",
  eventDate: "",
  eventTime: "",
  country: "",
  currency: "USD",
  genres: [],
  tickets: [],
  capacity: 1000,
  perPersonLimit: 10,
  ageLimit: 13,
});
```

**Real-time Updates:**

- As user types title/description → TicketPreview updates
- As user selects date/time → Display updates
- As user adds ticket tier → Preview shows in list

### Step 2: Configure Ticket Tiers

```javascript
// User adds multiple ticket tiers
tickets: [
  {
    id: "tier-1",
    ticketType: "VIP",
    currency: "NGN",
    price: 50000,
    quantity: 100,
    maxPerPerson: 5,
  },
  {
    id: "tier-2",
    ticketType: "Regular",
    currency: "NGN",
    price: 20000,
    quantity: 500,
    maxPerPerson: 10,
  },
];
```

**Each tier shows:**

- Type (VIP, General, Early Bird, etc.)
- Price with currency symbol
- Quantity available
- Per-person limit
- Real-time preview updates

### Step 3: Validate Form

```javascript
// Validation checks before submit
- Title length (3-200 chars)
- Description not empty
- Event date in future
- Event time valid
- Country selected
- At least 1 ticket tier
- Ticket prices > 0
- Quantity > 0
- eventDateTime after current time
```

### Step 4: Transform Data

```javascript
// CreateEvent.jsx handleSubmit()
const eventData = {
  title: form.title,
  description: form.description,
  eventDateTime: combineDateTime(form.eventDate, form.eventTime), // ISO format
  venueName: form.venueName,
  venueAddress: form.venueAddress,
  country: form.country,
  currency: form.currency,
  capacity: form.capacity,
  ageLimit: form.ageLimit,
  genres: form.genres,
  tickets: form.tickets.map((t) => ({
    ticketType: t.ticketType,
    currency: t.currency,
    price: parseFloat(t.price),
    quantity: parseInt(t.quantity),
    maxPerPerson: parseInt(t.maxPerPerson),
    description: t.description,
  })),
};
```

### Step 5: Send to Backend

```javascript
// POST /api/v1/events
const response = await axiosInstance.post("/events", eventData);
// Returns: EventResponse with event id and details
```

**Request Structure:**

```json
{
  "title": "Rema Live Concert",
  "description": "Exclusive live performance...",
  "eventDateTime": "2026-02-20T19:30:00Z",
  "venueName": "Lekki Arena",
  "venueAddress": "123 Lekki Street, Lagos",
  "country": "Nigeria",
  "currency": "NGN",
  "capacity": 5000,
  "ageLimit": 18,
  "genres": ["Afrobeats", "Hip-hop"],
  "tickets": [
    {
      "ticketType": "VIP",
      "currency": "NGN",
      "price": 50000,
      "quantity": 500,
      "maxPerPerson": 5,
      "description": "Premium front-row seating"
    }
  ]
}
```

### Step 6: Backend Processing

**EventController receiving request:**

1. Extract userId from JWT token
2. Validate organizer authorization
3. Pass to EventService.createEvent()

**EventService processing:**

```javascript
// Pseudocode of createEvent()
1. Create Event entity
   - Set fields from request
   - Set status = DRAFT
   - Set organizerId from JWT
   - Calculate totalCapacity

2. Create TicketTier entities
   - For each tickets[] in request
   - Create TicketTier with event_id FK
   - Set currency per tier
   - Initialize quantitySold = 0

3. Save with @Transactional
   - Ensures atomicity
   - All or nothing write

4. Return EventResponse
   - Include event id
   - Include all details
   - Include ticket tiers
```

### Step 7: Store in Database

**MySQL Tables:**

**events table:**

```sql
INSERT INTO events (
  id,
  organizer_id,
  title,
  description,
  event_datetime,
  venue_name,
  venue_address,
  country,
  currency,
  status,
  capacity,
  age_limit,
  total_revenue,
  created_at,
  updated_at
) VALUES (...)
```

**ticket_tiers table:**

```sql
INSERT INTO ticket_tiers (
  id,
  event_id,
  ticket_type,
  currency,
  price,
  quantity,
  quantity_sold,
  max_per_person,
  status,
  sale_ends_at,
  created_at
) VALUES (...)
```

### Step 8: Return Success Response

```json
{
  "success": true,
  "data": {
    "id": 42,
    "title": "Rema Live Concert",
    "status": "DRAFT",
    "eventDateTime": "2026-02-20T19:30:00Z",
    "country": "Nigeria",
    "totalRevenue": 0,
    "ticketTiers": [
      {
        "id": 101,
        "ticketType": "VIP",
        "currency": "NGN",
        "price": 50000,
        "quantitySold": 0,
        "status": "ACTIVE"
      }
    ],
    "createdAt": "2026-02-15T10:30:00Z",
    "publishedAt": null
  },
  "message": "Event created successfully"
}
```

### Step 9: Frontend Success Flow

```javascript
// CreateEvent.jsx
1. Show success toast: "Event created successfully!"
2. Wait 1500ms for user to see message
3. Navigate to /organizer/my-events
```

### Step 10: Display on Dashboard

**OrganizerDashboard updates:**

- Event count increments
- Draft event count increments
- New event appears in MyEvents list

---

## 🎮 Real-Time Preview System

### How It Works

**TicketPreview.jsx receives props:**

```javascript
<TicketPreview
  title={form.title}
  formattedDate={formatDate(form.eventDate)}
  formattedTime={formatTime(form.eventTime)}
  firstTicket={form.tickets[0]}
  ticketsLength={form.tickets.length}
/>
```

**Component renders live updates:**

1. Event title changes → Preview title updates
2. Date changes → Preview date updates
3. Time changes → Preview time updates
4. First ticket price changes → Preview price update
5. Currency changes → Preview currency symbol updates

**Currency Symbol Mapping:**

```javascript
const CURRENCY_SYMBOLS = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  KES: "KSh",
  ZAR: "R",
  GHS: "GH₵",
  CAD: "C$",
  INR: "₹",
  UGX: "UGX",
};
```

---

## 🖼️ Image Cropping System

### Features

- Canvas-based rectangular crop
- No external dependencies
- User-friendly interface
- Stores cropped image as File blob

### Flow

1. User uploads flyer image
2. Canvas appears with drag handles
3. User adjusts crop area
4. Apply crop → stores cropped image
5. Flyer preview updates
6. **Note: Currently placeholder - upload to S3 needed**

---

## 🌍 Currency Auto-Detection

### Country to Currency Mapping

```javascript
const COUNTRY_CURRENCY = {
  Nigeria: "NGN",
  "United States": "USD",
  "United Kingdom": "GBP",
  France: "EUR",
  Kenya: "KES",
  "South Africa": "ZAR",
  Ghana: "GHS",
  Canada: "CAD",
  India: "INR",
  Uganda: "UGX",
};
```

### Logic

1. User selects country
2. Currency auto-detected and set
3. User can override if needed
4. Each ticket tier can have different currency

---

## 📋 Form Validation

### Frontend Validation (Before Submit)

```javascript
- title.length >= 3 && title.length <= 200
- description not empty
- eventDate in future
- eventTime valid (HH:mm format)
- country selected
- tickets.length > 0
- all ticket prices > 0
- all ticket quantities > 0
- form.capacity > 0
```

### Backend Validation (EventService)

```java
- Event title not blank
- Event date in future
- Organizer exists and is authenticated
- All ticket prices positive
- All ticket quantities positive
- Per-person limit valid
- Capacity >= sum of ticket quantities
```

---

## 🔐 Authorization & Security

### Frontend Authorization

- Only logged-in ORGANIZER role can access CreateEvent
- ProtectedRoute wrapper verifies role
- Redirects unauthenticated to login

### Backend Authorization

- EventController protected by @Authorization annotation
- EventService verifies organizerId from JWT
- Only organizer can update/delete their own events
- Public endpoints don't require auth

### JWT Token Flow

```
1. User logs in → JWT token generated
2. Token stored in localStorage
3. Every API request includes: Authorization: Bearer <token>
4. Backend extracts userId from token
5. Verifies user owns the event being modified
```

---

## 📈 Dashboard Statistics

### OrganizerDashboard Components

**Event Stats:**

```
- Draft Events: Count of DRAFT status events
- Published Events: Count of PUBLISHED status
- Live Events: LIVE status
- Completed Events: COMPLETED status
```

**Revenue Overview:**

```
- Total Revenue: Sum of ticket sales
- Upcoming Events: Count of future events
- Active Sales: Events currently selling
```

### Backend Endpoint

**GET /api/v1/events/dashboard/stats**

```json
{
  "draftCount": 5,
  "publishedCount": 12,
  "liveCount": 2,
  "completedCount": 8,
  "totalCount": 27
}
```

---

## 🚀 Publishing Events

### Publish Flow

**Frontend (MyEvents.jsx):**

```javascript
// User clicks "Publish" button
const publishEvent = async (eventId) => {
  await axiosInstance.post(`/events/${eventId}/publish`);
  // Refreshes event list, shows updated status
};
```

**Backend (EventController):**

```java
POST /api/v1/events/{id}/publish

1. Verify event exists
2. Verify current user is organizer
3. Call EventService.publishEvent()
4. Return 200 OK with updated event
```

**EventService.publishEvent():**

```java
1. Fetch event from DB
2. Check status == DRAFT
3. If not DRAFT → throw IllegalStateException
4. Set status = PUBLISHED
5. Set publishedAt = now()
6. Save to DB
7. Return updated EventResponse
```

### Status Transition Rules

```
DRAFT → PUBLISHED (organizer action)
DRAFT → DELETED (organizer action)
PUBLISHED → LIVE (system on event start time)
LIVE → COMPLETED (system on event end)
Any status → CANCELLED (organizer action)
```

---

## 🔍 Upcoming Features

### Phase 1 (Current)

- ✅ Event creation with ticket tiers
- ✅ Real-time preview
- ✅ Image cropping UI
- ✅ Backend persistence
- ⏳ File upload to S3 for flyer

### Phase 2

- ⏳ Event editing (draft events)
- ⏳ Event cancellation
- ⏳ Ticket tier management
- ⏳ Sales tracking

### Phase 3

- ⏳ Revenue analytics
- ⏳ Attendee management
- ⏳ Email confirmations
- ⏳ Payment processing

---

## 🧪 Testing the Complete Flow

### Manual Testing Checklist

**1. Create Event**

- [ ] Register as organizer
- [ ] Navigate to Create Event
- [ ] Fill in all fields
- [ ] Add multiple ticket tiers
- [ ] Verify real-time preview updates
- [ ] Submit form
- [ ] Check success message
- [ ] Verify redirected to MyEvents

**2. Verify Database**

- [ ] Check events table has new record
- [ ] Check ticket_tiers table has records
- [ ] Verify organizer_id matches current user
- [ ] Verify status = DRAFT

**3. Dashboard Updates**

- [ ] Check OrganizerDashboard stats updated
- [ ] Verify draft count incremented
- [ ] Check MyEvents shows new event

**4. Publish Event**

- [ ] Click "Publish" in MyEvents
- [ ] Verify status changes to PUBLISHED
- [ ] Check publishedAt timestamp set
- [ ] Verify event appears in public upcoming

**5. Public Listing**

- [ ] Navigate to HomePage
- [ ] Verify published event appears
- [ ] Filter by country - event appears
- [ ] Filter by date range - event appears if matches

---

## 📚 API Reference

### Create Event

```
POST /api/v1/events
Authorization: Bearer <jwt-token>
Content-Type: application/json

Request: CreateEventRequest
Response: EventResponse (201 Created)
```

### Get Organizer Events

```
GET /api/v1/events?page=0&size=20
Authorization: Bearer <jwt-token>

Response: Page<EventResponse>
```

### Publish Event

```
POST /api/v1/events/{id}/publish
Authorization: Bearer <jwt-token>

Response: EventResponse (200 OK)
```

### Get Dashboard Stats

```
GET /api/v1/events/dashboard/stats
Authorization: Bearer <jwt-token>

Response: EventDashboardStats
```

### Public Upcoming Events

```
GET /api/v1/events/public/upcoming?page=0&size=20

Response: Page<EventResponse>
```

### Events by Country

```
GET /api/v1/events/public/country/{country}?page=0&size=20

Response: Page<EventResponse>
```

---

**Last Updated**: February 2026  
**Status**: Production Ready ✅
