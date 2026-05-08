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

def get_gemini_model():
    global current_key_index
    if not GEMINI_API_KEYS: return None
    genai.configure(api_key=GEMINI_API_KEYS[current_key_index])
    return genai.GenerativeModel('gemini-2.0-flash')

def rotate_gemini_key():
    global current_key_index
    current_key_index = (current_key_index + 1) % len(GEMINI_API_KEYS)
    print(f"🔄 Rotasi ke Gemini API Key ke-{current_key_index + 1}...")

def normalize_ai_response(data, original_news):
    """Pastikan data punya title dan content, gunakan original jika gagal"""
    title = data.get('title') or data.get('judul') or data.get('Judul') or original_news.get('title')
    content = data.get('content') or data.get('isi') or data.get('konten') or original_news.get('summary')
    return {"title": str(title), "content": str(content)}

def clean_json_string(s):
    s = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', s)
    return s

def process_with_mistral(news):
    print("🌀 Menggunakan Mistral AI sebagai cadangan...")
    if not MISTRAL_API_KEY: return normalize_ai_response({}, news)
    client = MistralClient(api_key=MISTRAL_API_KEY)
    prompt = f"Tulis ulang berita ini dalam JSON: {news['title']} - {news['summary']}. Gunakan format {{\"title\": \"...\", \"content\": \"...\"}}"
    try:
        messages = [ChatMessage(role="user", content=prompt)]
        chat_response = client.chat(model="mistral-tiny", messages=messages)
        content = chat_response.choices[0].message.content
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            data = json.loads(clean_json_string(json_match.group(0)), strict=False)
            return normalize_ai_response(data, news)
    except Exception as e:
        print(f"❌ Mistral Error: {e}")
    return normalize_ai_response({}, news)

def process_with_ai(news):
    for _ in range(len(GEMINI_API_KEYS)):
        try:
            print(f"🤖 Mencoba Gemini (Key {current_key_index + 1})...")
            model = get_gemini_model()
            response = model.generate_content(f"Tulis ulang dalam JSON: {news['title']} - {news['summary']}. Gunakan key 'title' dan 'content'.")
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                data = json.loads(clean_json_string(json_match.group(0)), strict=False)
                return normalize_ai_response(data, news)
        except Exception as e:
            print(f"⚠️ Gemini Gagal: {e}")
            rotate_gemini_key()
            time.sleep(1)
            continue
    return process_with_mistral(news)

def get_token():
    try:
        res = requests.post(f"{BASE_URL}/api/token", data={"username": "ai_bot", "password": AI_BOT_SECRET}, timeout=10)
        return res.json().get("access_token")
    except: return None

def fetch_latest_news(token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        res = requests.get(f"{BASE_URL}/api/ai-bot/sources", headers=headers, timeout=10)
        sources = res.json() if res.status_code == 200 else []
        if not sources: sources = [{"name": "Detik", "rss_url": "https://www.detik.com/terpopuler/inet/rss"}]
        random.shuffle(sources)
        for s in sources:
            try:
                r = requests.get(s['rss_url'], timeout=10)
                feed = feedparser.parse(r.content)
                if feed.entries:
                    entry = feed.entries[0]
                    img = "" # logic gambar dilewati dulu untuk kecepatan
                    return {"title": entry.title, "summary": entry.summary, "link": entry.link, "source": s['name'], "image": img}
            except: continue
    except: pass
    return None

def main():
    print("🎬 Memulai BaknusAI News Bot (Final Robust Mode)...")
    token = get_token()
    if not token: return
    news = fetch_latest_news(token)
    if not news: return
    
    processed = process_with_ai(news)
    
    # --- LOGGING DATA SEBELUM KIRIM ---
    print(f"📡 Menyiapkan paket data...")
    payload = {
        "title": processed.get('title'),
        "content": processed.get('content'),
        "category": "Berita Harian",
        "author": "BaknusAI Bot",
        "source": f"{news['source']} (Original: {news['link']})",
        "image_url": news.get('image', '')
    }
    print(f"📦 Payload yang akan dikirim: {json.dumps(payload, indent=2)[:200]}...")

    headers = {"Authorization": f"Bearer {token}"}
    try:
        res = requests.post(f"{BASE_URL}/api/news/", json=payload, headers=headers, timeout=20)
        if res.status_code == 200:
            print(f"🏆 SUKSES: Berita '{payload['title']}' berhasil terbit!")
        else:
            print(f"❌ Gagal Publish ke Server: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ Error Jaringan Saat Posting: {e}")

if __name__ == "__main__":
    main()
