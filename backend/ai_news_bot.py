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

def extract_image_url(entry):
    """Mencoba mengambil URL gambar dari berbagai tag RSS"""
    try:
        if hasattr(entry, 'enclosures') and entry.enclosures:
            for enc in entry.enclosures:
                if 'image' in enc.type: return enc.href
        if hasattr(entry, 'media_content'): return entry.media_content[0]['url']
        if 'summary' in entry:
            img_match = re.search(r'<img [^>]*src="([^"]+)"', entry.summary)
            if img_match: return img_match.group(1)
    except: pass
    return None

def process_with_ai(news):
    """Mengolah berita dengan filter IT/Pendidikan & Ringkasan 1 Paragraf"""
    prompt = f"""Tugas: Tulis ulang berita ini dalam 1 paragraf menarik untuk SMK. 
    KRITERIA: Harus berkaitan dengan IT, Teknologi, atau Pendidikan. 
    Jika berita TIDAK berkaitan dengan itu, balas hanya dengan kata 'SKIP'.
    
    BERITA: {news['title']} - {news['summary']}"""
    
    # Coba Gemini dulu
    for key in GEMINI_API_KEYS:
        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            res = model.generate_content(prompt)
            if res.text.strip().upper() == 'SKIP': return "SKIP"
            if res.text: return res.text.strip()
        except: continue
    
    # Coba Mistral
    if MISTRAL_API_KEY:
        try:
            client = MistralClient(api_key=MISTRAL_API_KEY)
            res = client.chat(model="mistral-tiny", messages=[ChatMessage(role="user", content=prompt)])
            text = res.choices[0].message.content.strip()
            if text.upper() == 'SKIP': return "SKIP"
            return text
        except: pass
    
    return news['summary'][:300] # Fallback jika AI gagal

def main():
    print("--- 🎬 BOT START (VERS: 3.0 - SMART & VISUAL) ---")
    
    # 1. Login
    try:
        r = requests.post(f"{BASE_URL}/api/token", data={"username": "ai_bot", "password": AI_BOT_SECRET}, timeout=10)
        token = r.json().get("access_token")
    except: return

    # 2. Ambil Sumber
    headers = {"Authorization": f"Bearer {token}"}
    sources = []
    try:
        res = requests.get(f"{BASE_URL}/api/ai-bot/sources", headers=headers, timeout=10)
        sources = res.json() if res.status_code == 200 else []
    except: pass
    if not sources: sources = [{"name": "Detik Inet", "rss_url": "https://www.detik.com/terpopuler/inet/rss"}]

    # 3. Cari berita yang relevan
    random.shuffle(sources)
    for s in sources:
        print(f"📰 Memeriksa sumber: {s['name']}...")
        try:
            r_rss = requests.get(s['rss_url'], timeout=10)
            feed = feedparser.parse(r_rss.content)
            for entry in feed.entries[:3]: # Cek 3 berita teratas
                image_url = extract_image_url(entry)
                news_data = {"title": entry.title, "summary": entry.summary, "link": entry.link}
                
                content = process_with_ai(news_data)
                if content == "SKIP":
                    print(f"⏭️ Melewati: {entry.title[:40]}... (Tidak relevan IT/Pendidikan)")
                    continue
                
                # 4. Jika lolos filter, siapkan upload
                print(f"✅ Berita Terpilih: {entry.title[:50]}")
                payload = {
                    "title": entry.title,
                    "content": content,
                    "category": "Berita Harian",
                    "is_pinned": "false"
                }
                
                files = {}
                tmp_img = None
                if image_url:
                    try:
                        print(f"🖼️ Mengunduh gambar: {image_url[:50]}...")
                        img_res = requests.get(image_url, timeout=10)
                        if img_res.status_code == 200:
                            suffix = ".jpg"
                            if ".png" in image_url: suffix = ".png"
                            tmp_img = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                            tmp_img.write(img_res.content)
                            tmp_img.close()
                            files = {"image": (f"news{suffix}", open(tmp_img.name, "rb"), f"image/{suffix[1:]}")}
                    except: print("⚠️ Gagal unduh gambar.")

                # 5. Kirim (Form-Data + File)
                res_post = requests.post(f"{BASE_URL}/api/news/", data=payload, files=files, headers=headers, timeout=30)
                
                # Bersihkan file temp
                if tmp_img: os.unlink(tmp_img.name)
                
                if res_post.status_code == 200:
                    print(f"🏆 SUKSES: Berita berhasil terbit dengan gambar!")
                    return # Berhenti setelah 1 berita sukses
                else:
                    print(f"❌ Gagal Publish: {res_post.text}")
        except: continue

if __name__ == "__main__":
    main()
