import os
import requests
import feedparser
import google.generativeai as genai
from datetime import datetime
import json
import random
import re

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# --- KONFIGURASI ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
BASE_URL = "http://localhost:8000" if os.path.exists("/.dockerenv") else os.getenv("VITE_API_URL", "https://smkbn666.sch.id")
AI_BOT_SECRET = os.getenv("AI_BOT_SECRET", "super_secret_ai_token")

# Ambil semua API Key yang tersedia
API_KEYS = [
    os.getenv("GEMINI_API_KEY"),
    os.getenv("GEMINI_API_KEY2")
]
API_KEYS = [k for k in API_KEYS if k] # Hanya ambil yang tidak kosong
current_key_index = 0

def get_model():
    global current_key_index
    if not API_KEYS:
        return None
    genai.configure(api_key=API_KEYS[current_key_index])
    return genai.GenerativeModel('gemini-2.5-flash')

def rotate_key():
    global current_key_index
    current_key_index = (current_key_index + 1) % len(API_KEYS)
    print(f"🔄 Rotasi ke API Key ke-{current_key_index + 1}...")

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

def extract_image_url(entry):
    """Mencoba mengambil URL gambar dari berbagai tag RSS"""
    # 1. Cek enclosure
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enc in entry.enclosures:
            if 'image' in enc.type: return enc.href
    
    # 2. Cek media:content atau media:thumbnail
    if hasattr(entry, 'media_content'):
        return entry.media_content[0]['url']
    
    # 3. Cek di dalam summary/description (Regex)
    img_match = re.search(r'<img [^>]*src="([^"]+)"', getattr(entry, 'summary', ''))
    if img_match: return img_match.group(1)
    
    return None

def fetch_latest_news(sources):
    if not sources:
        sources = [{"name": "Detik Inet", "rss_url": "https://www.detik.com/terpopuler/inet/rss"}]
    
    active_sources = [s for s in sources if s.get('is_active', True)]
    if not active_sources: return None
    
    source = random.choice(active_sources)
    print(f"📰 Mengambil berita dari: {source['name']}...")
    
    try:
        feed = feedparser.parse(source['rss_url'])
        if not feed.entries: return None
        
        entry = feed.entries[0]
        return {
            "title": entry.title,
            "summary": entry.summary,
            "link": entry.link,
            "source": source['name'],
            "original_image": extract_image_url(entry)
        }
    except Exception as e:
        print(f"❌ Error parsing feed: {e}")
        return None

def process_with_gemini(news):
    prompt = f"""
    Bertindaklah sebagai Jurnalis Utama & Edukator untuk SMK Bakti Nusantara 666.
    Tulis ulang berita ini untuk audiens UMUM, namun sertakan ajakan untuk siswa-siswi Bakti Nusantara 666 (RPL, DKV, Animasi, Pemasaran, Akuntansi).
    
    Berita: {news['title']}
    Sumber: {news['source']}
    Konten: {news['summary']}

    Format Output (JSON):
    {{
        "title": "Judul Baru Yang Keren",
        "content": "Isi berita 2-3 paragraf dengan ajakan siswa BN 666 di akhir..."
    }}
    """
    
    for _ in range(len(API_KEYS)):
        try:
            model = get_model()
            if not model: return None
            
            response = model.generate_content(prompt)
            # Cari pola {...} di dalam teks menggunakan regex
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                clean_json = json_match.group(0)
                return json.loads(clean_json)
            else:
                print("❌ Tidak ditemukan format JSON di jawaban Gemini.")
                return None
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                rotate_key()
                continue
            print(f"❌ Error Gemini Content: {e}")
            return None
    return None

def post_to_website(token, data, original_image_url, news_source, original_link):
    headers = {"Authorization": f"Bearer {token}"}
    image_file_path = "temp_news_image.jpg"
    has_image = False
    
    # --- 1. STRATEGI GAMBAR (MULTI-LAYER) ---
    
    # Layer 1: Coba Generate Gambar AI
    try:
        print(f"🎨 Mencoba membuat gambar AI...")
        image_response = image_model.generate_content(f"Illustration for news: {data['title']}")
        img_data = None
        if hasattr(image_response, 'data'): img_data = image_response.data
        elif hasattr(image_response, 'parts'):
            for p in image_response.parts:
                if hasattr(p, 'inline_data'): img_data = p.inline_data.data; break
        
        if img_data:
            with open(image_file_path, "wb") as f: f.write(img_data)
            has_image = True
            print("✅ Gambar AI Berhasil.")
    except Exception as e:
        print(f"⚠️ Gambar AI Gagal (Quota/Error).")

    # Layer 2: Jika AI Gagal, Ambil Gambar Asli Sumber
    if not has_image and original_image_url:
        try:
            print(f"🔗 Mengambil gambar asli sumber: {original_image_url}...")
            img_resp = requests.get(original_image_url, timeout=10)
            if img_resp.status_code == 200:
                with open(image_file_path, "wb") as f: f.write(img_resp.content)
                has_image = True
                print("✅ Gambar Sumber Berhasil.")
        except:
            print("⚠️ Gagal mengambil gambar asli.")

    # --- 2. KIRIM DATA KE API ---
    # Tambahkan sumber berita di akhir konten
    footer = f"\n\n--- \n📰 *Sumber: {news_source}* \n🔗 [Baca berita asli]({original_link})"
    
    payload = {
        "title": data['title'],
        "content": data['content'] + footer,
        "is_pinned": "false",
        "category": "Berita Harian"
    }
    
    files = {}
    if has_image:
        files['image'] = ('image.jpg', open(image_file_path, 'rb'), 'image/jpeg')

    try:
        response = requests.post(f"{BASE_URL}/api/news/", data=payload, files=files, headers=headers, timeout=30)
        if has_image: files['image'][1].close()
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error saat posting: {e}")
        return False

if __name__ == "__main__":
    token = get_token()
    if token:
        sources = fetch_sources_from_db(token)
        news = fetch_latest_news(sources)
        if news:
            ai_data = process_with_gemini(news)
            if ai_data:
                success = post_to_website(token, ai_data, news['original_image'], news['source'], news['link'])
                if success: print(f"🚀 SELESAI! Berita '{ai_data['title']}' sudah terbit.")
