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
    content = data.get('content') or data.get('isi') or original_news.get('summary', 'Konten berita sedang diproses.')
    return {"title": str(title), "content": str(content)}

def process_with_ai(news):
    for key in GEMINI_API_KEYS:
        try:
            print(f"🤖 Mencoba Gemini...")
            genai.configure(api_key=key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(f"Tulis ulang berita ini dalam 3 paragraf: {news['title']}")
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
    print("--- 🎬 BOT START (VERS: 2.4 - THE FINAL) ---")
    
    # 1. Login
    token = None
    try:
        r_login = requests.post(f"{BASE_URL}/api/token", data={"username": "ai_bot", "password": AI_BOT_SECRET}, timeout=15)
        token = r_login.json().get("access_token")
    except:
        print("❌ Gagal Login ke Backend.")
        return
    if not token: return

    # 2. Ambil Sumber dari Database
    print("📋 Mengambil daftar sumber berita...")
    sources = []
    try:
        res_sources = requests.get(f"{BASE_URL}/api/ai-bot/sources", headers={"Authorization": f"Bearer {token}"}, timeout=15)
        if res_sources.status_code == 200:
            sources = res_sources.json()
    except: pass
    
    if not sources:
        sources = [{"name": "Fallback Detik", "rss_url": "https://www.detik.com/terpopuler/inet/rss"}]

    # 3. Cari berita dari RSS yang merespon
    random.shuffle(sources)
    news = None
    for s in sources:
        print(f"📰 Menghubungi RSS: {s['name']}...")
        try:
            r_rss = requests.get(s['rss_url'], timeout=12)
            if r_rss.status_code == 200:
                feed = feedparser.parse(r_rss.content)
                if feed.entries:
                    entry = feed.entries[0]
                    news = {"title": entry.title, "summary": entry.summary, "link": entry.link, "source": s['name']}
                    print(f"✅ Berita ditemukan: {news['title'][:50]}...")
                    break
            else:
                print(f"⚠️ {s['name']} merespon {r_rss.status_code}. Mencoba yang lain...")
        except:
            print(f"⚠️ {s['name']} gagal dihubungi. Mencoba yang lain...")
            continue

    if not news:
        print("❌ Semua sumber berita gagal dihubungi.")
        return

    # 4. Proses AI
    processed = process_with_ai(news)
    
    # 5. Publish
    payload = {
        "title": str(processed['title']),
        "content": str(processed['content']),
        "category": "Berita Harian",
        "image_url": None
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    try:
        print(f"📡 Mengirim ke website...")
        # Coba dengan slash akhir (endpoint standar FastAPI)
        res = requests.post(f"{BASE_URL}/api/news/", json=payload, headers=headers, timeout=25, allow_redirects=True)
        
        if res.status_code == 200:
            print(f"🏆 BERHASIL! Berita '{payload['title']}' sudah terbit.")
        else:
            # Jika gagal, coba tanpa slash akhir
            print(f"🔄 Mencoba jalur alternatif...")
            res2 = requests.post(f"{BASE_URL}/api/news", json=payload, headers=headers, timeout=25)
            if res2.status_code == 200:
                print(f"🏆 BERHASIL (Jalur B)! Berita terbit.")
            else:
                print(f"❌ Gagal Total: {res2.text}")
    except Exception as e:
        print(f"❌ Fatal Error: {e}")

if __name__ == "__main__":
    main()
