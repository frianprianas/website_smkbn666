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
    # Pastikan selalu ada isi, jangan sampai None
    title = data.get('title') or data.get('judul') or original_news.get('title') or "Berita Baru"
    content = data.get('content') or data.get('isi') or original_news.get('summary') or "Konten berita."
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
    
    return normalize_ai_response({}, news)

def main():
    print("--- 🎬 BOT START (VERS: 2.1) ---")
    
    # 1. Login
    try:
        r_login = requests.post(f"{BASE_URL}/api/token", data={"username": "ai_bot", "password": AI_BOT_SECRET}, timeout=10)
        token = r_login.json().get("access_token")
        if not token:
            print("❌ Gagal Token.")
            return
    except Exception as e:
        print(f"❌ Gagal Login: {e}")
        return

    # 2. Ambil RSS (Langsung Detik untuk Tes)
    try:
        r_rss = requests.get("https://www.detik.com/terpopuler/inet/rss", timeout=10)
        feed = feedparser.parse(r_rss.content)
        entry = feed.entries[0]
        news = {"title": entry.title, "summary": entry.summary, "link": entry.link}
        print(f"✅ Berita: {news['title'][:50]}")
    except:
        print("❌ Gagal RSS.")
        return

    # 3. Proses AI
    processed = process_with_ai(news)
    
    # 4. Publish (TANPA garis miring di akhir /api/news)
    payload = {
        "title": str(processed['title']),
        "content": str(processed['content']),
        "category": "Berita Harian",
        "image_url": ""
    }
    
    print(f"📦 DEBUG DATA: {json.dumps(payload)[:100]}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        print(f"📡 Mengirim ke {BASE_URL}/api/news (Tanpa Slash)...")
        # GUNAKAN /api/news (TANPA SLASH AKHIR)
        res = requests.post(f"{BASE_URL}/api/news", json=payload, headers=headers, timeout=20)
        
        if res.status_code == 200:
            print("🏆 SUKSES: Berita Terbit!")
        else:
            print(f"❌ Error {res.status_code}: {res.text}")
    except Exception as e:
        print(f"❌ Fatal Error: {e}")

if __name__ == "__main__":
    main()
