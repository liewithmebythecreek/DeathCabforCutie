# SOP: Reviews & Reputation Integrity

## Goal
Allow post-ride reviews and handle "Ride Did Not Happen" scenarios to penalize abusers.

## Inputs
- `ride_id`
- `did_ride_happen` (Boolean)
- `rating` (Integer 1-5)
- `comment` (String)

## Tool Logic (Implementation)
1. Ride is marked 'completed' by Creator, or system assumes completion past a certain time.
2. Prompt pops up for passengers and creator to rate the ride.
3. Insert into `ride_reviews(reviewer_id, reviewee_id, did_ride_happen, rating, comment)`.
4. **Reputation Update (Backend Trigger or Frontend Logic):**
   - Calculate average rating for user and update `users.rating`.
   - If multiple passengers submit `did_ride_happen = false`, the creator's rating takes a massive penalty. (For MVP, we just record the review, and any subsequent logic queries standard averages).

## Edge Cases
- Spam reviews: Addressed by `UNIQUE(ride_id, reviewer_id, reviewee_id)` constraint in DB, preventing duplicate reviews for the same ride context.
