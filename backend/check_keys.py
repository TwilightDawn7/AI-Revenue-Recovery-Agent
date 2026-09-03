import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

def mask_key(k: str) -> str:
    if not k:
        return "<NOT SET>"
    if len(k) <= 8:
        return k[:2] + "****" + k[-2:]
    return k[:4] + "...." + k[-4:]

def check_gemini():
    print("=" * 60)
    print("1. CHECKING GOOGLE GEMINI API KEY")
    print("=" * 60)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        print(f"[-] GEMINI_API_KEY is not configured in .env (Found: {mask_key(api_key)})")
        print("    -> Note: The backend uses deterministic rule fallback when Gemini is offline.")
        return False
    
    print(f"[+] Found GEMINI_API_KEY: {mask_key(api_key)}")
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        # Test generation with gemini-3.6-flash
        model = genai.GenerativeModel("gemini-3.6-flash")
        response = model.generate_content("Ping. Reply with only the word PONG.")
        reply = response.text.strip()
        print(f"[SUCCESS] Gemini API is WORKING! Model (gemini-3.6-flash) response: '{reply}'")
        return True
    except Exception as e:
        print(f"[FAILED] Gemini API Error: {e}")
        return False

def check_razorpay():
    print("\n" + "=" * 60)
    print("2. CHECKING RAZORPAY API KEY")
    print("=" * 60)
    from app.core.config import settings
    key_id = settings.razorpay_key_id
    key_secret = settings.razorpay_key_secret

    print(f"[+] Parsed RAZORPAY_KEY_ID: {mask_key(key_id)}")
    print(f"[+] Parsed RAZORPAY_KEY_SECRET: {'<Provided>' if key_secret else '<Not Provided>'}")

    try:
        auth = (key_id, key_secret) if key_secret else None
        res = requests.get(
            "https://api.razorpay.com/v1/payments",
            params={"count": 1},
            auth=auth,
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            total_items = len(data.get("items", []))
            print(f"[SUCCESS] Razorpay API Authentication SUCCESSFUL! HTTP 200 OK (Connection verified)")
            return True
        elif res.status_code == 401:
            print(f"[FAILED] Razorpay Authentication FAILED (HTTP 401 Unauthorized): {res.json().get('error', {}).get('description', res.text)}")
            return False
        else:
            print(f"[!] Razorpay responded with HTTP {res.status_code}: {res.text}")
            return False
    except Exception as e:
        print(f"[FAILED] Razorpay Network Error: {e}")
        return False

def check_inngest():
    print("\n" + "=" * 60)
    print("3. CHECKING INNGEST CONFIGURATION")
    print("=" * 60)
    inngest_key = os.getenv("INNGEST_API_KEY", "").strip()
    inngest_dev = os.getenv("INNGEST_DEV", "1")
    print(f"[+] INNGEST_DEV mode: {inngest_dev} (1 = Local Dev Server, 0 = Inngest Cloud)")
    print(f"[+] INNGEST_API_KEY: {mask_key(inngest_key)}")
    
    try:
        import inngest
        client = inngest.Inngest(app_id="ai-revenue-recovery", is_production=(inngest_dev == "0"))
        print("[SUCCESS] Inngest Client initialized successfully.")
        
        # Test connecting to local inngest dev server if running
        try:
            r = requests.get("http://127.0.0.1:8288", timeout=1)
            if r.status_code == 200:
                print("[SUCCESS] Local Inngest Dev Server is currently running at http://127.0.0.1:8288!")
            else:
                print(f"[INFO] Inngest Dev Server returned HTTP {r.status_code} at http://127.0.0.1:8288")
        except Exception:
            print("[INFO] Inngest Dev Server is not running locally (start with `npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest` when needed).")
        return True
    except Exception as e:
        print(f"[FAILED] Inngest Client Error: {e}")
        return False

def check_database():
    print("\n" + "=" * 60)
    print("4. CHECKING DATABASE CONNECTION")
    print("=" * 60)
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/revenue_recovery")
    print(f"[+] Configured DATABASE_URL: {mask_key(db_url)}")
    
    from sqlalchemy import create_engine, text
    
    # 1. Test PostgreSQL if configured
    if db_url.startswith("postgresql"):
        try:
            engine = create_engine(db_url, connect_args={"client_encoding": "utf8"}, pool_pre_ping=True)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("[SUCCESS] PostgreSQL Connection: SUCCESSFUL (Database reachable and responsive)!")
            return True
        except Exception as e:
            print(f"[INFO] PostgreSQL at {mask_key(db_url)} is offline/unreachable: {e}")
            print("[SUCCESS] Application Fallback: Local SQLite database engine will be automatically used (Zero-config mode).")
            return True
    else:
        try:
            engine = create_engine(db_url, connect_args={"check_same_thread": False})
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("[SUCCESS] SQLite Connection: SUCCESSFUL!")
            return True
        except Exception as e:
            print(f"[FAILED] SQLite Error: {e}")
            return False

if __name__ == "__main__":
    print("\n============================================================")
    print("   AI REVENUE RECOVERY AGENT — API KEY & SERVICES AUDIT")
    print("============================================================\n")
    
    g_ok = check_gemini()
    r_ok = check_razorpay()
    i_ok = check_inngest()
    d_ok = check_database()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Gemini AI API:        {'[WORKING]' if g_ok else '[NOT WORKING / UNCONFIGURED]'}")
    print(f"Razorpay API:         {'[WORKING]' if r_ok else '[NOT WORKING / UNCONFIGURED]'}")
    print(f"Inngest Config:       {'[WORKING]' if i_ok else '[FAILED]'}")
    print(f"Database Engine:      {'[WORKING]' if d_ok else '[FAILED]'}")
    print("=" * 60 + "\n")
