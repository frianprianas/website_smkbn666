import os
import requests
import feedparser
import google.generativeai as genai
from datetime import datetime
import json
import random

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# --- KONFIGURASI ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Deteksi otomatis: Jika di Docker, gunakan localhost. Jika tidak, gunakan VITE_API_URL
BASE_URL = "http://localhost:8000" if os.path.exists("/.dockerenv") else os.getenv("VITE_API_URL", "https://smkbn666.sch.id")
AI_BOT_SECRET = os.getenv("AI_BOT_SECRET", "super_secret_ai_token")

print(f"Menggunakan API URL: {BASE_URL}")

genai.configure(api_key=GEMINI_API_KEY)

# Menggunakan model terbaru
model = genai.GenerativeModel('models/gemini-2.5-flash')
image_model = genai.GenerativeModel('models/gemini-2.5-flash-image')

def get_token():
    try:
        response = requests.post(f"{BASE_URL}/api/token", data={
            "username": "ai_bot",
            "password": AI_BOT_SECRET
        }, timeout=10)
        return response.json().get("access_token")
    except Exception as e:
        print(f"❌ Error login: {e}")
        return None

def fetch_sources_from_db(token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{BASE_URL}/api/ai-bot/sources", headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"❌ Error fetching sources: {e}")
        return []

def fetch_latest_news(sources):
    if not sources:
        print("⚠️ Database sumber kosong, menggunakan fallback...")
        sources = [{"name": "Detik Inet", "rss_url": "https://www.detik.com/terpopuler/inet/rss"}]
    
    active_sources = [s for s in sources if s.get('is_active', True)]
    if not active_sources: return None
    
    source = random.choice(active_sources)
    print(f"📰 Mengambil berita dari: {source['name']}...")
    
    try:
        feed = feedparser.parse(source['rss_url'])
        if not feed.entries:
            print(f"⚠️ Feed {source['name']} kosong.")
            return None
        
        return {
            "title": feed.entries[0].title,
            "summary": feed.entries[0].summary,
            "link": feed.entries[0].link,
            "source": source['name']
        }
    except Exception as e:
        print(f"❌ Error parsing feed: {e}")
        return None

def process_with_gemini(news):
    prompt = f"""
    Bertindaklah sebagai Jurnalis Utama & Edukator untuk SMK Bakti Nusantara 666.
    Tulis ulang berita ini untuk audiens UMUM, namun sertakan ajakan untuk siswa-siswi Bakti Nusantara 666.
    
    Berita: {news['title']}
    Sumber: {news['source']}
    Konten: {news['summary']}

    Aturan:
    1. Tulis dalam 2-3 paragraf profesional.
    2. Paragraf terakhir HARUS berisi ajakan relevan bagi siswa SMK BN 666.
    3. Cantumkan sumber link di akhir.

    Format Output (JSON):
    {{
        "title": "Judul Baru",
        "content": "Isi berita...",
        "image_prompt": "Prompt visualisasi teknologi"
    }}
    """
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_text)
    except Exception as e:
        print(f"❌ Error Gemini Content: {e}")
        return None

def post_to_website(token, data):
    headers = {"Authorization": f"Bearer {token}"}
    
    # --- 1. GENERATE GAMBAR AI ---
    image_file_path = "temp_news_image.jpg"
    has_image = False
    try:
        print(f"🎨 Membuat gambar AI untuk: {data['title']}...")
        img_prompt = f"Professional digital illustration of {data['title']}, high quality, tech style"
        image_response = image_model.generate_content(img_prompt)
        
        # Coba ambil data gambar dari berbagai kemungkinan atribut SDK
        img_data = None
        if hasattr(image_response, 'data'):
            img_data = image_response.data
        elif hasattr(image_response, 'parts'):
            for part in image_response.parts:
                if hasattr(part, 'inline_data'):
                    img_data = part.inline_data.data
                    break
        
        if img_data:
            with open(image_file_path, "wb") as f:
                f.write(img_data)
            has_image = True
            print("✅ Gambar AI berhasil dibuat.")
        else:
            print("⚠️ Data gambar tidak ditemukan dalam respon Gemini.")
    except Exception as e:
        print(f"❌ Gagal membuat gambar AI: {e}")

    # --- 2. KIRIM DATA KE API ---
    payload = {
        "title": data['title'],
        "content": data['content'],
        "is_pinned": "false"
    }
    
    files = {}
    if has_image:
        files['image'] = ('image.jpg', open(image_file_path, 'rb'), 'image/jpeg')

    try:
        response = requests.post(f"{BASE_URL}/api/news/", data=payload, files=files, headers=headers, timeout=30)
        if has_image: files['image'][1].close()
        
        if response.status_code == 200:
            print(f"🚀 BERHASIL! Berita '{data['title']}' sudah terbit di website.")
            return True
        else:
            print(f"❌ API Error ({response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error saat posting ke API: {e}")
        return False

if __name__ == "__main__":
    print(f"\n--- BaknusAi Run: {datetime.now()} ---")
    token = get_token()
    if not token:
        print("❌ Login Gagal. Cek koneksi ke backend.")
    else:
        sources = fetch_sources_from_db(token)
        news = fetch_latest_news(sources)
        if news:
            ai_data = process_with_gemini(news)
            if ai_data:
                post_to_website(token, ai_data)
        else:
            print("❌ Tidak ada berita baru yang bisa diambil.")
