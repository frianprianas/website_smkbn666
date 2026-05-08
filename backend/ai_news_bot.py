import os
import requests
import feedparser
import google.generativeai as genai
from datetime import datetime
import json
import random
import re
import time

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# --- KONFIGURASI ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Jika jalan di docker, gunakan localhost:8000. Jika tidak, gunakan VITE_API_URL
BASE_URL = "http://localhost:8000"
AI_BOT_SECRET = os.getenv("AI_BOT_SECRET", "super_secret_ai_token")

# Ambil semua API Key yang tersedia
API_KEYS = [
    os.getenv("GEMINI_API_KEY"),
    os.getenv("GEMINI_API_KEY2"),
    os.getenv("GEMINI_API_KEY3")
]
API_KEYS = [k for k in API_KEYS if k]
current_key_index = 0

print(f"🔧 Config: BASE_URL={BASE_URL}, API_KEYS_COUNT={len(API_KEYS)}")

def get_model():
    global current_key_index
    if not API_KEYS: return None
    genai.configure(api_key=API_KEYS[current_key_index])
    return genai.GenerativeModel('gemini-2.0-flash')

def rotate_key():
    global current_key_index
    current_key_index = (current_key_index + 1) % len(API_KEYS)
    print(f"🔄 Rotasi ke API Key ke-{current_key_index + 1}...")

def get_token():
    print(f"🔑 Sedang mencoba login ke {BASE_URL}/api/token...")
    try:
        response = requests.post(f"{BASE_URL}/api/token", data={
            "username": "ai_bot",
            "password": AI_BOT_SECRET
        }, timeout=10)
        if response.status_code == 200:
            print("✅ Login Berhasil.")
            return response.json().get("access_token")
        else:
            print(f"❌ Login Gagal: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error Koneksi saat Login: {e}")
        return None

def fetch_sources_from_db(token):
    print("Fetch daftar sumber berita dari database...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{BASE_URL}/api/ai-bot/sources", headers=headers, timeout=10)
        if response.status_code == 200:
            sources = response.json()
            print(f"✅ Berhasil mengambil {len(sources)} sumber.")
            return sources
        return []
    except Exception as e:
        print(f"❌ Error Fetch Sources: {e}")
        return []

def extract_image_url(entry):
    try:
        if hasattr(entry, 'enclosures') and entry.enclosures:
            for enc in entry.enclosures:
                if 'image' in enc.type: return enc.href
        if hasattr(entry, 'media_content'): return entry.media_content[0]['url']
        img_match = re.search(r'<img [^>]*src="([^"]+)"', getattr(entry, 'summary', ''))
        if img_match: return img_match.group(1)
    except: pass
    return None

def fetch_latest_news(sources):
    if not sources: 
        print("⚠️ Tidak ada sumber di DB, gunakan fallback Detik...")
        sources = [{"name": "Detik Inet", "rss_url": "https://www.detik.com/terpopuler/inet/rss"}]
    
    active_sources = [s for s in sources if s.get('is_active', True)]
    if not active_sources: return None
    
    # Acak urutan sumber agar tidak selalu mencoba yang sama duluan
    random.shuffle(active_sources)
    
    for source in active_sources:
        print(f"📰 Menghubungi RSS: {source['name']} ({source['rss_url']})...")
        try:
            print("⏳ Requesting RSS content...")
            resp = requests.get(source['rss_url'], timeout=10)
            
            if resp.status_code != 200:
                print(f"⚠️ Sumber {source['name']} bermasalah (Status {resp.status_code}). Mencoba sumber lain...")
                continue

            print(f"📥 Respon diterima ({resp.status_code}). Parsing feed...")
            feed = feedparser.parse(resp.content)
            if not feed.entries: 
                print(f"⚠️ Feed {source['name']} kosong. Mencoba sumber lain...")
                continue
                
            entry = feed.entries[0]
            print(f"✨ Berita terpilih: {entry.title}")
            return {
                "title": entry.title,
                "summary": entry.summary,
                "link": entry.link,
                "source": source['name'],
                "original_image": extract_image_url(entry)
            }
        except Exception as e:
            print(f"💥 Koneksi ke {source['name']} gagal: {e}. Mencoba sumber lain...")
            continue
            
    print("❌ Semua sumber berita gagal dihubungi.")
    return None

def process_with_gemini(news):
    prompt = f"Tulis ulang berita ini dalam 3 paragraf menarik: {news['title']} - {news['summary']}. Jawab dalam JSON: {{\"title\": \"...\", \"content\": \"...\"}}"
    for i in range(len(API_KEYS)):
        try:
            print(f"🤖 Memulai AI Processing (Key {current_key_index + 1})...")
            model = get_model()
            response = model.generate_content(prompt)
            print("✅ AI berhasil merespon.")
            
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                print("❌ AI merespon tapi bukan format JSON.")
        except Exception as e:
            print(f"⚠️ Kesalahan AI pada Key {current_key_index + 1}: {e}")
            rotate_key()
            time.sleep(2)
    return None

def main():
    print("--- MULAI PROSES BOT ---")
    token = get_token()
    if not token: return
    
    sources = fetch_sources_from_db(token)
    news = fetch_latest_news(sources)
    if not news: 
        print("❌ Gagal mendapatkan berita.")
        return
        
    print("🚀 Melanjutkan ke tahap AI...")
    processed_news = process_with_gemini(news)
    
    if processed_news:
        print("📡 Mengirim hasil ke website...")
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "title": processed_news['title'],
            "content": processed_news['content'],
            "category": "Berita Harian",
            "author": "BaknusAI Bot",
            "image_url": news['original_image'],
            "source": f"{news['source']} (Original: {news['link']})"
        }
        res = requests.post(f"{BASE_URL}/api/news/", json=payload, headers=headers, timeout=20)
        if res.status_code == 200:
            print("🏆 SUKSES: Berita berhasil terbit!")
        else:
            print(f"❌ Gagal Publish: {res.status_code} - {res.text}")
    else:
        print("❌ Gagal total di tahap AI.")

if __name__ == "__main__":
    main()
