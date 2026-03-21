# SOP: Authentication Flow

## Goal
Restrict platform access strictly to users with campus email domains.

## Inputs
- Supabase Auth provider: Google OAuth.

## Tool Logic (Implementation)
1. Configure Supabase Google Auth.
2. the initial login UI presents a "Sign in with Google" button.
3. Upon redirect back to the app, parse the session user email.
4. **Validation:** `if (!user.email.endsWith("@campus.edu"))` (or configured domain).
5. If invalid: Immediately call `supabase.auth.signOut()` and show "Unauthorized Domain" error.
6. If valid: Upsert user details into `public.users` table using their UUID, email, and name.

## Edge Cases
- User logs in with personal Gmail: Handled by Step 4/5. 
- User metadata (name/avatar) missing: Fallback to email prefix or default avatar.
