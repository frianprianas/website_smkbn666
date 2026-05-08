import os
import requests
import feedparser
import google.generativeai as genai
from datetime import datetime
import json
import random

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# --- KONFIGURASI ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
BASE_URL = os.getenv("VITE_API_URL", "https://smkbn666.sch.id")
AI_BOT_SECRET = os.getenv("AI_BOT_SECRET", "super_secret_ai_token")

genai.configure(api_key=GEMINI_API_KEY)

# Menggunakan model terbaru
model = genai.GenerativeModel('models/gemini-2.5-flash')
# Model untuk generate gambar
image_model = genai.GenerativeModel('models/gemini-2.5-flash-image')

def get_token():
    """Mendapatkan token akses menggunakan bypass ai_bot"""
    try:
        response = requests.post(f"{BASE_URL}/api/token", data={
            "username": "ai_bot",
            "password": AI_BOT_SECRET
        })
        return response.json().get("access_token")
    except Exception as e:
        print(f"Error login: {e}")
        return None

def fetch_sources_from_db(token):
    """Mengambil daftar sumber berita dari database"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{BASE_URL}/api/ai-bot/sources", headers=headers)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching sources: {e}")
        return []

def fetch_latest_news(sources):
    """Mengambil berita terbaru dari sumber acak (rotasi)"""
    if not sources:
        # Fallback if DB is empty
        sources = [
            {"name": "Detik Inet", "rss_url": "https://www.detik.com/terpopuler/inet/rss"},
            {"name": "Kompas Tekno", "rss_url": "https://tekno.kompas.com/rss/all.xml"}
        ]
    
    active_sources = [s for s in sources if s.get('is_active', True)]
    if not active_sources: return None
    
    # Random selection for variety as requested
    source = random.choice(active_sources)
    
    print(f"Mengambil berita dari: {source['name']}...")
    feed = feedparser.parse(source['rss_url'])
    if not feed.entries: return None
    
    return {
        "title": feed.entries[0].title,
        "summary": feed.entries[0].summary,
        "link": feed.entries[0].link,
        "source": source['name']
    }

def process_with_gemini(news):
    """Menyusun ulang berita dengan gaya narasi umum + ajakan untuk siswa"""
    prompt = f"""
    Bertindaklah sebagai Jurnalis Utama & Edukator untuk SMK Bakti Nusantara 666.
    Tulis ulang berita ini untuk audiens UMUM, namun di akhir narasi wajib sertakan ajakan atau keterkaitan konteks berita dengan potensi/keterlibatan siswa-siswi SMK Bakti Nusantara 666 (terutama jurusan RPL, DKV, Animasi, Pemasaran, atau Akuntansi).
    
    Berita:
    Judul: {news['title']}
    Sumber: {news['source']} ({news['link']})
    Konten: {news['summary']}

    Aturan:
    1. Tulis dalam 2-3 paragraf yang sangat menarik, profesional, dan inspiratif.
    2. Paragraf terakhir HARUS berisi ajakan atau analisis bagaimana berita ini relevan bagi pengembangan diri siswa SMK Bakti Nusantara 666.
    3. Gunakan gaya bahasa yang keren, up-to-date, dan memotivasi.
    4. Cantumkan sumber link di akhir artikel.

    Format Output (JSON):
    {{
        "title": "Judul Berita Yang Sangat Menarik",
        "content": "Isi berita lengkap dengan narasi umum dan ajakan siswa...",
        "image_prompt": "Detailed prompt for generating a high-quality tech/educational illustration"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_text)
    except Exception as e:
        print(f"Error Gemini Content: {e}")
        return None

def post_to_website(token, data):
    """Membuat gambar AI dan mengirim berita ke API website"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # --- 1. GENERATE GAMBAR AI ---
    print(f"Generating AI illustration for: {data['title']}...")
    image_file_path = "ai_news_image.jpg"
    has_image = False
    try:
        # Prompt untuk gambar
        prompt = f"Digital art, high resolution, 3D render style, professional, related to: {data['title']}. Include subtle elements of technology and education."
        image_response = image_model.generate_content(prompt)
        
        # Check for image data in different possible futuristic SDK formats
        img_data = None
        if hasattr(image_response, 'data'):
            img_data = image_response.data
        elif hasattr(image_response, 'parts') and len(image_response.parts) > 0:
            part = image_response.parts[0]
            if hasattr(part, 'inline_data'):
                img_data = part.inline_data.data
            elif hasattr(part, 'text'):
                # Sometimes it might return a URL if using a specific tool, but let's assume bytes
                print("Image model returned text instead of bytes. Trying to parse if it's base64...")
        
        if img_data:
            with open(image_file_path, "wb") as f:
                f.write(img_data)
            has_image = True
            print("AI Image successfully generated.")
        else:
            print("Model Image did not return raw bytes. Skipping image.")
    except Exception as e:
        print(f"Gagal membuat gambar AI: {e}")

    # --- 2. KIRIM DATA KE API ---
    payload = {
        "title": data['title'],
        "content": data['content'],
        "is_pinned": False
    }
    
    files = {}
    if has_image:
        files['image'] = open(image_file_path, 'rb')

    try:
        response = requests.post(f"{BASE_URL}/api/news/", data=payload, files=files, headers=headers)
        if has_image: files['image'].close()
        
        if response.status_code == 200:
            print("News successfully posted!")
            return True
        else:
            print(f"API Error ({response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"Error saat posting: {e}")
        return False

if __name__ == "__main__":
    print(f"--- BaknusAi Auto-Kontributor Run at {datetime.now()} ---")
    token = get_token()
    if not token:
        print("Auth failed.")
    else:
        sources = fetch_sources_from_db(token)
        news = fetch_latest_news(sources)
        if news:
            ai_data = process_with_gemini(news)
            if ai_data:
                post_to_website(token, ai_data)
