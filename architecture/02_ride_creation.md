# SOP: Ride Creation

## Goal
Allow a verified user to create a ride listing that others can discover, ensuring data integrity for locations and times.

## Inputs
- `pickup_location_name`, `pickup_lat`, `pickup_lng`
- `destination_name`, `destination_lat`, `destination_lng`
- `departure_time` (ISO string)
- `max_occupancy` (Integer)

## Tool Logic (Implementation)
1. Frontend uses Leaflet.js to capture coordinates / names.
2. Validate inputs locally:
   - `departure_time` > current time.
   - `max_occupancy` > 0.
3. Call `supabase.from('rides').insert(...)`. `creator_id` is automatically set by Auth constraints or parsed from the session. `available_seats` equals `max_occupancy`.
4. Redirect creator to the Ride Details view (`/rides/:id`).

## Edge Cases
- User creates a ride in the past: Prevented by local validation.
- Missing location coordinates: Prevent submission.
