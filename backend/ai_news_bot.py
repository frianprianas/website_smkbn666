import os
import requests
import feedparser
import google.generativeai as genai
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
import json
import random
import re
import time

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# --- KONFIGURASI ---
GEMINI_API_KEYS = [os.getenv("GEMINI_API_KEY"), os.getenv("GEMINI_API_KEY2"), os.getenv("GEMINI_API_KEY3")]
GEMINI_API_KEYS = [k for k in GEMINI_API_KEYS if k]
MISTRAL_API_KEY = os.getenv("MISTRAL_API")
BASE_URL = "http://127.0.0.1:8000"
AI_BOT_SECRET = os.getenv("AI_BOT_SECRET", "super_secret_ai_token")

def normalize_ai_response(data, original_news):
    title = data.get('title') or data.get('judul') or original_news.get('title', 'Berita Baknus')
    content = data.get('content') or data.get('isi') or original_news.get('summary', 'Isi berita sedang diproses.')
    return {"title": str(title), "content": str(content)}

def process_with_ai(news):
    for key in GEMINI_API_KEYS:
        try:
            print(f"🤖 Mencoba Gemini...")
            genai.configure(api_key=key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(f"Tulis ulang berita: {news['title']}")
            if response.text:
                return normalize_ai_response({"title": news['title'], "content": response.text}, news)
        except: continue
    
    if MISTRAL_API_KEY:
        try:
            print("🌀 Mencoba Mistral...")
            client = MistralClient(api_key=MISTRAL_API_KEY)
            res = client.chat(model="mistral-tiny", messages=[ChatMessage(role="user", content=f"Rangkum: {news['title']}")])
            return normalize_ai_response({"title": news['title'], "content": res.choices[0].message.content}, news)
        except: pass
    
    return normalize_ai_response({"title": news['title'], "content": news['summary']}, news)

def main():
    print("--- 🎬 BOT START (VERS: 2.3 - ULTIMATE PAYLOAD) ---")
    
    # 1. Login
    try:
        r_login = requests.post(f"{BASE_URL}/api/token", data={"username": "ai_bot", "password": AI_BOT_SECRET}, timeout=10)
        token = r_login.json().get("access_token")
    except:
        print("❌ Gagal Login.")
        return
    if not token: return

    # 2. Ambil Berita (Contoh Cepat)
    try:
        r_rss = requests.get("https://www.detik.com/terpopuler/inet/rss", timeout=10)
        feed = feedparser.parse(r_rss.content)
        entry = feed.entries[0]
        news = {"title": entry.title, "summary": entry.summary, "link": entry.link}
        print(f"✅ Berita: {news['title'][:50]}...")
    except:
        print("❌ Gagal RSS.")
        return

    # 3. Proses AI
    processed = process_with_ai(news)
    
    # 4. Publish
    # HANYA kirim field wajib untuk tes
    payload = {
        "title": str(processed['title']),
        "content": str(processed['content']),
        "image_url": None,
        "video_url": None,
        "is_pinned": False,
        "category": "Berita Harian"
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    print(f"📡 Mengirim ke {BASE_URL}/api/news/ (Dengan Slash Akhir)...")
    
    try:
        # Gunakan json=payload agar requests menangani encoding secara otomatis
        res = requests.post(
            f"{BASE_URL}/api/news/", 
            json=payload, 
            headers=headers, 
            timeout=20,
            allow_redirects=False # Jangan biarkan redirect merusak body
        )
        
        if res.status_code == 200:
            print("🏆 SUKSES: Berita Terbit!")
        else:
            print(f"❌ Gagal {res.status_code}: {res.text}")
            
            # Percobaan Kedua: Tanpa Slash jika gagal
            if res.status_code == 404 or res.status_code == 422:
                print("🔄 Mencoba tanpa slash...")
                res2 = requests.post(f"{BASE_URL}/api/news", json=payload, headers=headers, timeout=20)
                if res2.status_code == 200:
                    print("🏆 SUKSES (Tanpa Slash)!")
                else:
                    print(f"❌ Gagal Total: {res2.text}")
                    
    except Exception as e:
        print(f"❌ Fatal Error: {e}")

if __name__ == "__main__":
    main()
