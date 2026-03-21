import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY")
    exit(1)

try:
    supabase: Client = create_client(url, key)
    # Perform a simple select
    response = supabase.table('rides').select('*').limit(1).execute()
    print("Success! Successfully connected to Supabase and queried the 'rides' table.")
    print("Data:", response.data)
except Exception as e:
    print("Failed to connect or query Supabase:", repr(e))
    exit(1)
