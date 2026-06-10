import os
import requests
from dotenv import load_dotenv
 
load_dotenv()
 
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
 
if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError(
        "Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env"
    )
 
REST_URL = f"{SUPABASE_URL}/rest/v1"
 
HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
}
 
 
def get_table(table_name, filters=None):
    params = {"select": "*"}
    if filters:
        # filters maps a column -> Supabase filter expression, e.g. {"email": "eq.a@b.com"}
        params.update(filters)
    response = requests.get(
        f"{REST_URL}/{table_name}",
        headers=HEADERS,
        params=params,
        timeout=15,
    )
    response.raise_for_status()
    return response.json()
 
 
def insert_row(table_name, data):
    response = requests.post(
        f"{REST_URL}/{table_name}",
        headers={**HEADERS, "Prefer": "return=representation"},
        json=data,
        timeout=15,
    )
    response.raise_for_status()
    return response.json()
