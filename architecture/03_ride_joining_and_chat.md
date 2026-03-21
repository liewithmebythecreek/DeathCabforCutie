# SOP: Ride Joining & Chat

## Goal
Manage the request-to-join flow and unlock ride-specific chat only for approved participants.

## Inputs
- Join: `ride_id`, `user_id` (requester)
- Approve: `request_id`, `status` ('approved' v 'rejected')
- Chat: `ride_id`, `content`

## Tool Logic (Implementation)
### Joining
1. Requester views ride. Clicks "Request to Join".
2. Insert into `ride_requests(ride_id, user_id, status='pending')`.
3. Ride creator sees pending requests via realtime subscription or periodic fetch.

### Approving
1. Creator clicks "Approve". 
2. Update `ride_requests(status='approved')`.
3. Decrease `available_seats` in `rides` by 1.

### Chat
1. For any given `ride_id`, the chat UI subscribes to `chat_messages` via Supabase Realtime where `ride_id` matches.
2. **Access Control:** UI only renders Chat box if current user is Creator OR has an 'approved' request. (RLS should ideally enforce this, but since we rely on Frontend logic and basic RLS, UI enforcement is primary).
3. On message send, insert into `chat_messages`.

## Edge Cases
- Seats full: If `available_seats == 0`, transition ride status from 'open' to 'departed' or disable further join approvals.
- User requests multiple times: Handled by `UNIQUE(ride_id, user_id)` constraint in DB.
