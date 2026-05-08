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
BASE_URL = "http://localhost:8000"
AI_BOT_SECRET = os.getenv("AI_BOT_SECRET", "super_secret_ai_token")

current_key_index = 0

def normalize_ai_response(data, original_news):
    title = data.get('title') or data.get('judul') or original_news.get('title')
    content = data.get('content') or data.get('isi') or original_news.get('summary')
    
    # Jika content malah jadi JSON/Dict, ubah jadi string teks
    if isinstance(content, dict):
        content = " ".join([str(v) for v in content.values()])
    
    return {"title": str(title), "content": str(content)}

def process_with_mistral(news):
    print("🌀 Menggunakan Mistral AI sebagai cadangan...")
    if not MISTRAL_API_KEY: return normalize_ai_response({}, news)
    client = MistralClient(api_key=MISTRAL_API_KEY)
    prompt = f"Rangkum berita ini dalam 3 paragraf teks biasa (BUKAN JSON): {news['title']} - {news['summary']}"
    try:
        messages = [ChatMessage(role="user", content=prompt)]
        chat_response = client.chat(model="mistral-tiny", messages=messages)
        content = chat_response.choices[0].message.content
        # Karena kita minta teks biasa, kita buat dict manual
        return normalize_ai_response({"title": news['title'], "content": content}, news)
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
            response = model.generate_content(f"Tulis ulang berita ini dalam 3 paragraf: {news['title']} - {news['summary']}")
            return normalize_ai_response({"title": news['title'], "content": response.text}, news)
        except Exception as e:
            print(f"⚠️ Gemini Gagal: {e}")
            current_key_index = (current_key_index + 1) % len(GEMINI_API_KEYS)
            time.sleep(1)
            continue
    return process_with_mistral(news)

def main():
    print("🎬 Memulai BaknusAI News Bot (Force Payload Mode)...")
    
    # 1. Login
    try:
        res_token = requests.post(f"{BASE_URL}/api/token", data={"username": "ai_bot", "password": AI_BOT_SECRET}, timeout=10)
        token = res_token.json().get("access_token")
    except: return

    # 2. Ambil Berita
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = requests.get("https://www.detik.com/terpopuler/inet/rss", timeout=10)
        feed = feedparser.parse(r.content)
        entry = feed.entries[0]
        news = {"title": entry.title, "summary": entry.summary, "link": entry.link, "source": "Detik"}
    except: return

    # 3. Proses AI
    processed = process_with_ai(news)
    
    # 4. Publish (Gunakan headers yang sangat spesifik)
    print(f"📡 Mengirim ke {BASE_URL}/api/news/ ...")
    payload = {
        "title": str(processed['title']),
        "content": str(processed['content']),
        "category": "Berita Harian",
        "author": "BaknusAI Bot",
        "source": f"Detik (Original: {news['link']})",
        "image_url": ""
    }
    
    try:
        # Gunakan json=payload DAN pastikan Content-Type terpasang otomatis oleh requests
        res = requests.post(
            f"{BASE_URL}/api/news/", 
            json=payload, 
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, 
            timeout=20
        )
        if res.status_code == 200:
            print(f"🏆 SUKSES: Berita berhasil terbit!")
        else:
            print(f"❌ Gagal: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
