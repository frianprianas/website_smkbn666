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
BASE_URL = "http://127.0.0.1:8000"
AI_BOT_SECRET = os.getenv("AI_BOT_SECRET", "super_secret_ai_token")

current_key_index = 0

def normalize_ai_response(data, original_news):
    title = data.get('title') or data.get('judul') or original_news.get('title')
    content = data.get('content') or data.get('isi') or original_news.get('summary')
    return {"title": str(title), "content": str(content)}

def process_with_mistral(news):
    print("🌀 Mencoba Mistral AI...")
    if not MISTRAL_API_KEY: return normalize_ai_response({}, news)
    client = MistralClient(api_key=MISTRAL_API_KEY)
    prompt = f"Rangkum berita ini dalam 3 paragraf menarik: {news['title']} - {news['summary']}"
    try:
        messages = [ChatMessage(role="user", content=prompt)]
        chat_response = client.chat(model="mistral-tiny", messages=messages)
        return normalize_ai_response({"title": news['title'], "content": chat_response.choices[0].message.content}, news)
    except: return normalize_ai_response({}, news)

def process_with_ai(news):
    global current_key_index
    for _ in range(len(GEMINI_API_KEYS)):
        try:
            print(f"🤖 Mencoba Gemini (Key {current_key_index + 1})...")
            genai.configure(api_key=GEMINI_API_KEYS[current_key_index])
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(f"Tulis ulang berita ini dalam 3 paragraf: {news['title']}")
            return normalize_ai_response({"title": news['title'], "content": response.text}, news)
        except Exception as e:
            print(f"⚠️ Gemini Gagal: {e}")
            current_key_index = (current_key_index + 1) % len(GEMINI_API_KEYS)
            time.sleep(1)
    return process_with_mistral(news)

def main():
    print("--- 🎬 MEMULAI BAKNUSAI NEWS BOT ---")
    
    # 1. Login
    try:
        res = requests.post(f"{BASE_URL}/api/token", data={"username": "ai_bot", "password": AI_BOT_SECRET}, timeout=10)
        token = res.json().get("access_token")
        if not token: 
            print("❌ Gagal dapat token.")
            return
    except: 
        print("❌ Gagal login ke server.")
        return

    # 2. Ambil Sumber dari DB
    print("📋 Mengambil daftar sumber berita dari database...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        res_sources = requests.get(f"{BASE_URL}/api/ai-bot/sources", headers=headers, timeout=10)
        sources = res_sources.json() if res_sources.status_code == 200 else []
        if not sources:
            sources = [{"name": "Detik", "rss_url": "https://www.detik.com/terpopuler/inet/rss"}]
    except:
        sources = [{"name": "Detik", "rss_url": "https://www.detik.com/terpopuler/inet/rss"}]

    # 3. Cari berita dari RSS yang aktif
    random.shuffle(sources)
    news = None
    for s in sources:
        print(f"📰 Menghubungi RSS: {s['name']}...")
        try:
            r = requests.get(s['rss_url'], timeout=10)
            feed = feedparser.parse(r.content)
            if feed.entries:
                entry = feed.entries[0]
                news = {"title": entry.title, "summary": entry.summary, "link": entry.link, "source": s['name']}
                print(f"✅ Berita ditemukan: {news['title'][:50]}...")
                break
        except:
            print(f"⚠️ {s['name']} tidak merespon, mencoba yang lain...")
            continue

    if not news:
        print("📭 Tidak ada berita yang bisa diambil saat ini.")
        return

    # 4. Proses AI
    processed = process_with_ai(news)
    
    # 5. Publish
    print("📡 Mengirim hasil ke website...")
    payload = {
        "title": str(processed['title']),
        "content": str(processed['content']),
        "category": "Berita Harian",
        "author": "BaknusAI Bot",
        "source": f"{news['source']} (Original: {news['link']})",
        "image_url": ""
    }
    try:
        res = requests.post(f"{BASE_URL}/api/news/", json=payload, headers={"Authorization": f"Bearer {token}"}, timeout=20)
        if res.status_code == 200: print(f"🏆 SUKSES: Berita '{processed['title']}' terbit!")
        else: print(f"❌ Gagal Terbit: {res.text}")
    except Exception as e:
        print(f"❌ Error Publish: {e}")

if __name__ == "__main__":
    main()
