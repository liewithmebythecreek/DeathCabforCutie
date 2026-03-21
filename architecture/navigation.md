# Navigation (Decision Making Logic)
This file represents Layer 2 of the 3-layer architecture. It routes data between the Frontend application and the backend Supabase constraints.

## Goal
Decouple deterministic business logic from the UI components. The Frontend should simply call these abstracted navigation routes.

## Route 1: Authentication Gateway
- **Input:** User attempts to hit `/home` or opens app.
- **Logic:** Check Supabase Auth session.
  - If no session -> Route to `/login`
  - If session exists but email domain is incorrect -> Log out & show error.
  - If session valid -> Route to `/rides`
- **Corresponding SOP:** `01_auth_flow.md`

## Route 2: Ride Creation
- **Input:** User submits Ride Creation form.
- **Logic:**
  - Validate: Departure time > now, occupancy > 0, pickup/destination present.
  - Insert to `rides` table.
  - On Success -> Route to `/rides/:ride_id`
- **Corresponding SOP:** `02_ride_creation.md`

## Route 3: Joining a Ride & Chat
- **Input (Rider):** User clicks "Join Ride" on `/rides`.
- **Logic (Rider):** 
  - Insert `ride_requests` with status 'pending'. 
  - Show "Pending Approval" UI state.
- **Input (Creator):** Creator reviews requests on `/rides/:ride_id`.
- **Logic (Creator):**
  - Update `ride_requests` status to 'approved' or 'rejected'.
  - If 'approved', realtime subscription unlocks Chat UI for that user.
- **Corresponding SOP:** `03_ride_joining_and_chat.md`

## Route 4: Ride Completion & Review
- **Input:** Creator marks ride 'completed' OR departure time + 2 hours elapsed.
- **Logic:**
  - Update `rides` status to 'completed'.
  - Chat becomes read-only.
  - Prompt users to submit `ride_reviews`.
- **Corresponding SOP:** `04_reviews_and_ratings.md`
