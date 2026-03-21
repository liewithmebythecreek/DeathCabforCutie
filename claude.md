# Project Constitution (claude.md)

## System Identity & North Star
**North Star:** Build a campus-only rickshaw ride-sharing web application that makes sharing convenient, transparent, and trustworthy.

## Core Behavioral Rules
1. **Strict Authentication:** 
   - Non-campus accounts MUST be rejected instantly.
   - Users MUST authenticate to view, create, or request rides.
2. **Ride Creation Constraints:**
   - Must have pickup/destination, future departure time, and positive occupancy constraint.
3. **Ride Joining Protocol:**
   - Rides are not joined automatically.
   - Users submit requests -> Creator approves/rejects.
4. **Chat Invariants:**
   - Only opens between Creator and Approved passengers.
   - Tied exclusively to the specific ride.
   - Closes automatically upon ride completion/reviews and becomes read-only.
5. **Review & Reputation Integrity:**
   - Reviews determine status. If multiple users report `did_ride_happen = false`, the creator's rating must decrease automatically. Repeated offenses restrict creation privileges.

## Architectural Invariants
- **Layer 1 (Architecture):** Technical SOPs in Markdown governing logic. Golden Rule: Update SOP before code.
- **Layer 2 (Navigation):** Reasoning layer routing data between SOPs and Tools.
- **Layer 3 (Tools):** Deterministic scripts. (Virtual environments enforced).
- **Frontend Layer:** The application must be delivered as a web application via the browser, natively running Leaflet.js with OpenStreetMap.
- **Backend/Database:** Persistent data & realtime comms must route exactly through Supabase (accessed through the Supabase MCP). No custom backend servers allowed.
- **Environment:** Secrets in `.env`.
- **Intermediates:** `.tmp/` is used for ephemeral operations.
