import os
import requests
import feedparser
import google.generativeai as genai
from datetime import datetime
import json
import random
import re
import socket
import time

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# --- KONFIGURASI ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
BASE_URL = "http://localhost:8000" if os.path.exists("/.dockerenv") else os.getenv("VITE_API_URL", "https://smkbn666.sch.id")
AI_BOT_SECRET = os.getenv("AI_BOT_SECRET", "super_secret_ai_token")

# Ambil semua API Key yang tersedia
API_KEYS = [os.getenv("GEMINI_API_KEY"), os.getenv("GEMINI_API_KEY2")]
API_KEYS = [k for k in API_KEYS if k]
current_key_index = 0

def get_model():
    global current_key_index
    if not API_KEYS: return None
    genai.configure(api_key=API_KEYS[current_key_index])
    return genai.GenerativeModel('gemini-1.5-flash')

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
        print(f"❌ Error login ke Backend: {e}")
        return None

def fetch_sources_from_db(token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{BASE_URL}/api/ai-bot/sources", headers=headers, timeout=10)
        if response.status_code == 200: return response.json()
        return []
    except Exception as e:
        print(f"❌ Error ambil daftar sumber: {e}")
        return []

def extract_image_url(entry):
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enc in entry.enclosures:
            if 'image' in enc.type: return enc.href
    if hasattr(entry, 'media_content'): return entry.media_content[0]['url']
    img_match = re.search(r'<img [^>]*src="([^"]+)"', getattr(entry, 'summary', ''))
    if img_match: return img_match.group(1)
    return None

def fetch_latest_news(sources):
    if not sources: 
        sources = [{"name": "Detik Inet", "rss_url": "https://www.detik.com/terpopuler/inet/rss"}]
    
    active_sources = [s for s in sources if s.get('is_active', True)]
    if not active_sources: return None
    
    source = random.choice(active_sources)
    print(f"📰 Menghubungi sumber: {source['name']}...")
    
    try:
        # GUNAKAN REQUESTS DENGAN TIMEOUT KETAT (Agar tidak hang)
        resp = requests.get(source['rss_url'], timeout=10)
        if resp.status_code != 200:
            print(f"❌ Sumber {source['name']} memberikan respon error {resp.status_code}")
            return None
            
        feed = feedparser.parse(resp.content)
        if not feed.entries: 
            print(f"⚠️ Tidak ada berita baru di {source['name']}")
            return None
            
        entry = feed.entries[0]
        print(f"✅ Berita ditemukan: {entry.title[:50]}...")
        return {
            "title": entry.title,
            "summary": entry.summary,
            "link": entry.link,
            "source": source['name'],
            "original_image": extract_image_url(entry)
        }
    except Exception as e:
        print(f"❌ Koneksi ke {source['name']} gagal: {e}")
        return None

def process_with_gemini(news):
    prompt = f"""Bertindaklah sebagai Jurnalis SMK Bakti Nusantara 666. Tulis ulang berita ini dalam 3 paragraf: {news['title']} - {news['summary']}. Format JSON: {{"title": "...", "content": "..."}}"""
    for _ in range(len(API_KEYS)):
        try:
            model = get_model()
            print(f"🤖 Mengolah dengan Gemini (Key {current_key_index + 1})...")
            response = model.generate_content(prompt)
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match: return json.loads(json_match.group(0))
        except Exception as e:
            if "429" in str(e).lower() or "quota" in str(e).lower():
                print(f"⚠️ Key {current_key_index+1} limit.")
                rotate_key()
                time.sleep(1)
                continue
            print(f"❌ Error AI: {e}")
    return None

def post_to_website(token, data, original_image_url, news_source, original_link):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "title": data['title'],
        "content": data['content'],
        "category": "Berita Harian",
        "author": "BaknusAI Bot",
        "image_url": original_image_url,
        "source": f"{news_source} (Original: {original_link})"
    }
    try:
        res = requests.post(f"{BASE_URL}/api/news/", json=payload, headers=headers, timeout=15)
        if res.status_code == 200:
            print(f"🚀 BERHASIL: Berita '{data['title']}' telah terbit!")
            return True
        print(f"❌ Gagal Posting ke Web: {res.text}")
    except Exception as e:
        print(f"❌ Error saat mengirim ke Web: {e}")
    return False

def main():
    print("🎬 Memulai BaknusAI News Bot...")
    token = get_token()
    if not token: return
    
    sources = fetch_sources_from_db(token)
    news = fetch_latest_news(sources)
    if not news: 
        print("📭 Tidak ada berita untuk diproses saat ini.")
        return
        
    processed_news = process_with_gemini(news)
    if processed_news:
        post_to_website(token, processed_news, news['original_image'], news['source'], news['link'])
    else:
        print("❌ Gagal memproses berita dengan AI.")

if __name__ == "__main__":
    main()
