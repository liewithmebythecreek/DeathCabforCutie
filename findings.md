# Findings
*Research, discoveries, constraints, and learnings will be logged here.*

- **Supabase Realtime:** Can activate selectively by tables since not all tables require realtime (`rides`, `ride_requests`, `chat_messages` added to publication).
- **Google OAuth Mapping:** To enforce users log in via campus domain only, Google Cloud Console sets the rule; my schema just assumes `users.id` maps directly to Supabase Auth (`auth.users`).
- **Python venv constraint:** Needed to execute Python directly via `/home/savi/DEP/venv/bin/python` to maintain isolation. Pip modules needed: `supabase`, `python-dotenv`.
