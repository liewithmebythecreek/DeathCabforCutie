-- Privacy: add show_identity column to users table
-- Default TRUE so existing users remain fully visible (no breaking change)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS show_identity boolean NOT NULL DEFAULT true;

-- Optional: add a comment for documentation
COMMENT ON COLUMN users.show_identity IS
  'When false the user appears as anonymous in ride listings and public profiles. '
  'Identity is still revealed to the ride creator on join requests, and to all '
  'confirmed participants once the user is accepted into a ride.';
