import os
import requests
import feedparser
import google.generativeai as genai
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from datetime import datetime
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

# Gunakan 127.0.0.1 agar lebih stabil di Docker
BASE_URL = "http://127.0.0.1:8000"
AI_BOT_SECRET = os.getenv("AI_BOT_SECRET", "super_secret_ai_token")

current_key_index = 0

def normalize_ai_response(data, original_news):
    title = data.get('title') or data.get('judul') or original_news.get('title')
    content = data.get('content') or data.get('isi') or original_news.get('summary')
    if isinstance(content, dict):
        content = " ".join([str(v) for v in content.values()])
    return {"title": str(title), "content": str(content)}

def process_with_mistral(news):
    print("🌀 Mencoba Mistral AI...")
    if not MISTRAL_API_KEY: return normalize_ai_response({}, news)
    client = MistralClient(api_key=MISTRAL_API_KEY)
    prompt = f"Tulis ulang berita ini dalam 3 paragraf: {news['title']} - {news['summary']}"
    try:
        messages = [ChatMessage(role="user", content=prompt)]
        chat_response = client.chat(model="mistral-tiny", messages=messages)
        return normalize_ai_response({"title": news['title'], "content": chat_response.choices[0].message.content}, news)
    except Exception as e:
        print(f"❌ Mistral Error: {e}")
    return normalize_ai_response({}, news)

def process_with_ai(news):
    global current_key_index
    for _ in range(len(GEMINI_API_KEYS)):
        try:
            print(f"🤖 Mencoba Gemini (Key {current_key_index + 1})...")
            genai.configure(api_key=GEMINI_API_KEYS[current_key_index])
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(f"Tulis ulang berita ini: {news['title']}")
            return normalize_ai_response({"title": news['title'], "content": response.text}, news)
        except Exception as e:
            print(f"⚠️ Gemini Gagal: {e}")
            current_key_index = (current_key_index + 1) % len(GEMINI_API_KEYS)
            time.sleep(1)
    return process_with_mistral(news)

def main():
    print("--- 🎬 MEMULAI BAKNUSAI NEWS BOT ---")
    
    # 1. Login
    print(f"🔑 Mencoba login ke {BASE_URL}...")
    token = None
    try:
        res_token = requests.post(f"{BASE_URL}/api/token", data={"username": "ai_bot", "password": AI_BOT_SECRET}, timeout=15)
        if res_token.status_code == 200:
            token = res_token.json().get("access_token")
            print("✅ Login Berhasil.")
        else:
            print(f"❌ Login Gagal ({res_token.status_code}): {res_token.text}")
            return
    except Exception as e:
        print(f"❌ Koneksi ke Backend Gagal: {e}")
        return

    # 2. Ambil Berita (RSS)
    print("📰 Mengambil berita terbaru dari RSS...")
    try:
        r = requests.get("https://www.detik.com/terpopuler/inet/rss", timeout=15)
        feed = feedparser.parse(r.content)
        if not feed.entries:
            print("📭 Tidak ada berita ditemukan di RSS.")
            return
        entry = feed.entries[0]
        news = {"title": entry.title, "summary": entry.summary, "link": entry.link}
        print(f"✅ Berita didapat: {news['title'][:50]}...")
    except Exception as e:
        print(f"❌ Gagal ambil RSS: {e}")
        return

    # 3. Proses AI
    processed = process_with_ai(news)
    
    # 4. Publish
    print("📡 Mengirim hasil ke website...")
    payload = {
        "title": str(processed['title']),
        "content": str(processed['content']),
        "category": "Berita Harian",
        "author": "BaknusAI Bot",
        "source": f"Detik (Original: {news['link']})",
        "image_url": ""
    }
    
    try:
        res = requests.post(
            f"{BASE_URL}/api/news/", 
            json=payload, 
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, 
            timeout=25
        )
        if res.status_code == 200:
            print("🏆 SUKSES: Berita berhasil terbit di website!")
        else:
            print(f"❌ Gagal Terbit ({res.status_code}): {res.text}")
    except Exception as e:
        print(f"❌ Error Jaringan: {e}")

if __name__ == "__main__":
    main()
