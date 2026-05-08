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

def normalize_ai_response(data):
    """Memastikan data memiliki kunci 'title' dan 'content'"""
    normalized = {}
    # Cari judul
    normalized['title'] = data.get('title') or data.get('judul') or data.get('Judul') or data.get('Title')
    # Cari konten
    normalized['content'] = data.get('content') or data.get('isi') or data.get('konten') or data.get('Content')
    
    if normalized['title'] and normalized['content']:
        return normalized
    return None

def process_with_mistral(news):
    print("🌀 Menggunakan Mistral AI sebagai cadangan...")
    if not MISTRAL_API_KEY: return None
    
    client = MistralClient(api_key=MISTRAL_API_KEY)
    prompt = f"""Tulis ulang berita ini untuk website SMK Bakti Nusantara 666.
    BERITA: {news['title']} - {news['summary']}
    
    WAJIB menggunakan format JSON persis seperti ini:
    {{"title": "Judul Baru", "content": "Isi Berita 3 Paragraf"}}
    """
    
    try:
        messages = [ChatMessage(role="user", content=prompt)]
        chat_response = client.chat(model="mistral-tiny", messages=messages)
        content = chat_response.choices[0].message.content
        print(f"DEBUG MISTRAL: {content[:100]}...") # Intip sedikit responnya
        
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            return normalize_ai_response(data)
    except Exception as e:
        print(f"❌ Mistral Error: {e}")
    return None

def process_with_ai(news):
    # Tahap 1: Coba Gemini
    for _ in range(len(GEMINI_API_KEYS)):
        try:
            print(f"🤖 Mencoba Gemini (Key {current_key_index + 1})...")
            model = get_gemini_model()
            prompt = f"Tulis ulang berita ini dalam JSON: {news['title']} - {news['summary']}. Gunakan key 'title' dan 'content'."
            response = model.generate_content(prompt)
            
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                return normalize_ai_response(data)
        except Exception as e:
            print(f"⚠️ Gemini Gagal: {e}")
            rotate_gemini_key()
            time.sleep(1)
            continue
    
    return process_with_mistral(news)

# --- FUNGSI PENDUKUNG (LOGIN, FETCH, POST) ---

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
                    return {"title": entry.title, "summary": entry.summary, "link": entry.link, "source": s['name']}
            except: continue
    except: pass
    return None

def main():
    print("🎬 Memulai BaknusAI News Bot (Hybrid Gemini + Mistral)...")
    token = get_token()
    if not token: return
    
    news = fetch_latest_news(token)
    if not news: 
        print("❌ Gagal mendapatkan berita dari semua sumber.")
        return
        
    processed = process_with_ai(news)
    if processed:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "title": processed['title'],
            "content": processed['content'],
            "category": "Berita Harian",
            "author": "BaknusAI Bot",
            "source": f"{news['source']} (Original: {news['link']})"
        }
        res = requests.post(f"{BASE_URL}/api/news/", json=payload, headers=headers, timeout=20)
        if res.status_code == 200: print(f"🏆 SUKSES: Berita '{processed['title']}' terbit!")
        else: print(f"❌ Gagal Publish: {res.text}")
    else:
        print("❌ Gagal total: Semua AI (Gemini & Mistral) tidak merespon.")

if __name__ == "__main__":
    main()
