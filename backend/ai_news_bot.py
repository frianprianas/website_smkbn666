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

# Pastikan menggunakan 127.0.0.1 agar stabil di Docker
BASE_URL = "http://127.0.0.1:8000"
AI_BOT_SECRET = os.getenv("AI_BOT_SECRET", "super_secret_ai_token")

def normalize_ai_response(data, original_news):
    title = data.get('title') or data.get('judul') or original_news.get('title', 'Berita Baknus')
    content = data.get('content') or data.get('isi') or original_news.get('summary', 'Isi berita sedang diproses.')
    return {"title": str(title), "content": str(content)}

def process_with_ai(news):
    # Tahap 1: Coba Gemini
    for key in GEMINI_API_KEYS:
        try:
            print(f"🤖 Mencoba Gemini...")
            genai.configure(api_key=key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(f"Tulis ulang berita ini: {news['title']}")
            return normalize_ai_response({"title": news['title'], "content": response.text}, news)
        except: continue
    
    # Tahap 2: Coba Mistral
    print("🌀 Mencoba Mistral...")
    if MISTRAL_API_KEY:
        try:
            client = MistralClient(api_key=MISTRAL_API_KEY)
            res = client.chat(model="mistral-tiny", messages=[ChatMessage(role="user", content=f"Rangkum: {news['title']}")])
            return normalize_ai_response({"title": news['title'], "content": res.choices[0].message.content}, news)
        except: pass
    
    return normalize_ai_response({}, news)

def main():
    print("--- 🎬 MEMULAI BAKNUSAI NEWS BOT ---")
    
    # 1. Login
    try:
        r_login = requests.post(f"{BASE_URL}/api/token", data={"username": "ai_bot", "password": AI_BOT_SECRET}, timeout=10)
        token = r_login.json().get("access_token")
    except:
        print("❌ Gagal login.")
        return

    # 2. Ambil Berita (Contoh Detik)
    try:
        r_rss = requests.get("https://www.detik.com/terpopuler/inet/rss", timeout=10)
        feed = feedparser.parse(r_rss.content)
        entry = feed.entries[0]
        news = {"title": entry.title, "summary": entry.summary, "link": entry.link}
    except:
        print("❌ Gagal ambil RSS.")
        return

    # 3. Proses AI
    processed = process_with_ai(news)
    
    # 4. Publish (Point of Failure)
    payload = {
        "title": str(processed['title']),
        "content": str(processed['content']),
        "category": "Berita Harian",
        "image_url": ""
    }
    
    print(f"📡 Mengirim ke {BASE_URL}/api/news/ ...")
    print(f"📦 DEBUG PAYLOAD: {json.dumps(payload)}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    try:
        # Gunakan data=json.dumps agar 100% terbungkus JSON dengan benar
        res = requests.post(
            f"{BASE_URL}/api/news/", 
            data=json.dumps(payload), 
            headers=headers, 
            timeout=20
        )
        if res.status_code == 200:
            print("🏆 SUKSES: Berita berhasil terbit!")
        else:
            print(f"❌ Gagal: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ Error Jaringan: {e}")

if __name__ == "__main__":
    main()
