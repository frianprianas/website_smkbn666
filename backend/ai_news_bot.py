import os
import requests
import feedparser
import google.generativeai as genai
# mistralai removed, using requests instead
import json
import random
import re
import time
import tempfile

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# --- KONFIGURASI ---
GEMINI_API_KEYS = [os.getenv("GEMINI_API_KEY"), os.getenv("GEMINI_API_KEY2"), os.getenv("GEMINI_API_KEY3")]
GEMINI_API_KEYS = [k for k in GEMINI_API_KEYS if k]
MISTRAL_API_KEY = os.getenv("MISTRAL_API")
BASE_URL = "http://127.0.0.1:8000"
AI_BOT_SECRET = os.getenv("AI_BOT_SECRET", "super_secret_ai_token")

# Sumber Berita Pilihan User
NEW_SOURCES = [
    {"name": "Tekno 1 (Antara)", "url": "https://www.antaranews.com/rss/tekno.xml", "lang": "id"},
    {"name": "Tekno 2 (Tempo)", "url": "https://rss.tempo.co/teknologi", "lang": "id"},
    {"name": "Tekno 3 (Detik)", "url": "https://www.detik.com/terpopuler/inet/rss", "lang": "id"},
    {"name": "Pendidikan (BBC)", "url": "https://www.bbc.co.uk/news/education/rss.xml", "lang": "en"},
    {"name": "Ekonomi (CNBC)", "url": "https://www.cnbcindonesia.com/news/rss", "lang": "id"}
]

def check_duplicate(title, token):
    """Cek apakah berita dengan judul serupa sudah ada di website"""
    try:
        res = requests.get(f"{BASE_URL}/api/news/", headers={"Authorization": f"Bearer {token}"}, timeout=10)
        if res.status_code == 200:
            existing_news = res.json()
            for news in existing_news[:15]: # Cek 15 berita terakhir
                # Gunakan regex sederhana untuk membandingkan kata-kata kunci
                if title[:20].lower() in news['title'].lower(): return True
    except: pass
    return False

def process_with_ai(news, lang):
    """Mengolah berita dengan Golden Prompt (Terjemah + Intisari)"""
    lang_instr = "Terjemahkan berita ini ke Bahasa Indonesia yang baik." if lang == "en" else ""
    prompt = f"""Tugas: {lang_instr} 
    Uraikan intisari berita ini dalam 1 paragraf yang kohesif, profesional, dan menarik untuk siswa SMK Bakti Nusantara 666.
    Jangan gunakan kata-kata yang terlalu sulit. Fokus pada fakta pentingnya.
    
    BERITA: {news['title']} - {news['summary']}"""
    
    for key in GEMINI_API_KEYS:
        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            res = model.generate_content(prompt)
            if res.text: return res.text.strip()
        except: continue
    
    if MISTRAL_API_KEY:
        try:
            url = "https://api.mistral.ai/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {MISTRAL_API_KEY}"
            }
            payload = {
                "model": "mistral-tiny",
                "messages": [{"role": "user", "content": prompt}]
            }
            response = requests.post(url, headers=headers, json=payload, timeout=15)
            return response.json()['choices'][0]['message']['content'].strip()
        except: pass
    return news['summary'][:300]

def main():
    print("--- 🎬 BOT START (VERS: 3.1 - CURATED) ---")
    
    # 1. Login
    try:
        r = requests.post(f"{BASE_URL}/api/token", data={"username": "ai_bot", "password": AI_BOT_SECRET}, timeout=10)
        token = r.json().get("access_token")
    except: return

    # 2. Acak Sumber Baru
    random.shuffle(NEW_SOURCES)
    headers = {"Authorization": f"Bearer {token}"}

    for s in NEW_SOURCES:
        print(f"📰 Menghubungi Sumber: {s['name']}...")
        try:
            r_rss = requests.get(s['url'], timeout=12)
            feed = feedparser.parse(r_rss.content)
            for entry in feed.entries[:5]: # Cek 5 teratas
                title = entry.title
                
                # Cek Duplikasi
                if check_duplicate(title, token):
                    print(f"⏭️ Duplikat Terdeteksi: {title[:40]}...")
                    continue
                
                # Proses AI
                print(f"✅ Berita Terpilih: {title[:50]}")
                content = process_with_ai({"title": title, "summary": entry.summary}, s['lang'])
                
                # Cari Gambar
                image_url = None
                if hasattr(entry, 'enclosures') and entry.enclosures: image_url = entry.enclosures[0].href
                elif hasattr(entry, 'media_content'): image_url = entry.media_content[0]['url']
                
                # Upload
                payload = {"title": title, "content": content, "category": "Berita Harian", "is_pinned": "false"}
                files = {}
                tmp_img = None
                if image_url:
                    try:
                        img_res = requests.get(image_url, timeout=10)
                        if img_res.status_code == 200:
                            tmp_img = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
                            tmp_img.write(img_res.content)
                            tmp_img.close()
                            files = {"image": ("news.jpg", open(tmp_img.name, "rb"), "image/jpeg")}
                    except: pass

                res_post = requests.post(f"{BASE_URL}/api/news/", data=payload, files=files, headers=headers, timeout=30)
                if tmp_img: os.unlink(tmp_img.name)
                
                if res_post.status_code == 200:
                    print(f"🏆 SUKSES: Berita terbit tanpa duplikasi!")
                    return # Cukup 1 berita per eksekusi
                else: print(f"❌ Gagal: {res_post.text}")
        except: continue

if __name__ == "__main__":
    main()
