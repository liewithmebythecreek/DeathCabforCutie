# Data Schema & Maintenance Log (gemini.md)

## Core Data Schema

The system uses a Supabase PostgreSQL database. All JSON/object interactions will conform to the following schema shapes.

### 1. User
```json
{
  "id": "uuid (primary key)",
  "email": "string (restricted to campus domain)",
  "name": "string",
  "avatar_url": "string (optional)",
  "rating": "float (0.0 to 5.0)",
  "total_reviews": "integer",
  "created_at": "timestamp"
}
```

### 2. Ride
```json
{
  "id": "uuid (primary key)",
  "creator_id": "uuid (foreign key -> users.id)",
  "pickup_location_name": "string",
  "pickup_lat": "float",
  "pickup_lng": "float",
  "destination_name": "string",
  "destination_lat": "float",
  "destination_lng": "float",
  "departure_time": "timestamp",
  "max_occupancy": "integer",
  "available_seats": "integer",
  "status": "string ('open', 'departed', 'completed', 'cancelled')"
}
```

### 3. Ride Request (Join Request)
```json
{
  "id": "uuid (primary key)",
  "ride_id": "uuid (foreign key -> rides.id)",
  "user_id": "uuid (foreign key -> users.id)",
  "status": "string ('pending', 'approved', 'rejected')",
  "created_at": "timestamp"
}
```

### 4. Chat Message
```json
{
  "id": "uuid (primary key)",
  "ride_id": "uuid (foreign key -> rides.id)",
  "sender_id": "uuid (foreign key -> users.id)",
  "content": "string",
  "created_at": "timestamp"
}
```

### 5. Ride Review
```json
{
  "id": "uuid (primary key)",
  "ride_id": "uuid (foreign key -> rides.id)",
  "reviewer_id": "uuid (foreign key -> users.id)",
  "reviewee_id": "uuid (foreign key -> users.id)",
  "did_ride_happen": "boolean",
  "rating": "integer (1 to 5)",
  "comment": "string (optional)",
  "created_at": "timestamp"
}
```

## Immutable Rules
1. **Data-First:** Coding only begins once Payload shape is confirmed.
2. **Backend Limitation:** No external backend services. Supabase is the sole backend. Leaflet maps operate purely on the frontend.
3. **Authentication:** Only Google OAuth. Only users with the designated campus email domain can access or use any features.
4. **Self-Annealing (The Repair Loop):** Analyze -> Patch -> Test -> Update Architecture SOP.

## Maintenance Log
- **2026-03-07:** V1 deployed. Supabase utilized for backend Authentication, PostgreSQL, and Realtime endpoints.
- **Frontend Assets:** Delivered as an SPA build via Vite React.
- **Review Adjustments:** If a user’s reputation drops drastically from `did_ride_happen=false` submissions, consider adding a serverless edge function limit.
- **Map Operations:** Powered purely by Client-side Leaflet matching Map bounds natively.
