import os
import requests
import feedparser
import google.generativeai as genai
from datetime import datetime
import json

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- KONFIGURASI ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
BASE_URL = os.getenv("VITE_API_URL", "https://smkbn666.sch.id")
AI_BOT_SECRET = os.getenv("AI_BOT_SECRET", "super_secret_ai_token")

# Daftar Sumber Berita
SOURCES = [
    {"name": "Detik Inet", "rss": "https://www.detik.com/terpopuler/inet/rss"},
    {"name": "Kompas Tekno", "rss": "https://tekno.kompas.com/rss/all.xml"},
    {"name": "CNN Teknologi", "rss": "https://www.cnnindonesia.com/teknologi/rss"}
]

genai.configure(api_key=GEMINI_API_KEY)

# Menggunakan model terbaru yang tersedia di akun Anda
model = genai.GenerativeModel('models/gemini-2.5-flash')
# Model untuk generate gambar (Visualisasi)
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

def fetch_latest_news():
    """Mengambil berita terbaru dari sumber harian"""
    day_of_year = datetime.now().timetuple().tm_yday
    source = SOURCES[day_of_year % len(SOURCES)]
    
    print(f"Mengambil berita dari: {source['name']}...")
    feed = feedparser.parse(source['rss'])
    if not feed.entries: return None
    
    return {
        "title": feed.entries[0].title,
        "summary": feed.entries[0].summary,
        "link": feed.entries[0].link,
        "source": source['name']
    }

def process_with_gemini(news):
    """Menyusun ulang berita menggunakan Gemini"""
    prompt = f"""
    Bertindaklah sebagai Jurnalis Teknologi untuk SMK Bakti Nusantara 666.
    Tulis ulang berita ini:
    Judul: {news['title']}
    Sumber: {news['source']} ({news['link']})
    Ringkasan: {news['summary']}

    Aturan:
    1. Tulis dalam 2 paragraf yang menarik dan edukatif.
    2. Gunakan gaya bahasa formal namun modern (khas Sekolah Pusat Keunggulan).
    3. Sertakan kalimat penutup yang relevan untuk siswa SMK.
    4. Cantumkan sumber link di akhir.
    5. Berikan saran 1 kata kunci bahasa Inggris untuk mencari gambar ilustrasi yang cocok.

    Format Output (JSON):
    {{
        "title": "Judul Menarik Baru",
        "content": "Isi berita 2 paragraf...",
        "image_keyword": "tech visualization"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        # Membersihkan output jika ada markdown
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_text)
    except Exception as e:
        print(f"Error Gemini: {e}")
        return None

def post_to_website(token, data):
    """Membuat gambar AI dan mengirim berita ke API website"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # --- 1. GENERATE GAMBAR AI ---
    print(f"Sedang membuat visualisasi gambar untuk: {data['title']}...")
    image_file_path = "temp_news_image.jpg"
    try:
        # Meminta Gemini membuat gambar berdasarkan keyword
        image_response = image_model.generate_content(f"Create a professional, high-quality digital illustration for a news article about: {data['title']}. Style: Modern, clean, tech-oriented.")
        
        # Di model Gemini 2.5 Image, output biasanya berupa bytes gambar
        if hasattr(image_response, 'data'):
            with open(image_file_path, "wb") as f:
                f.write(image_response.data)
        else:
            # Jika model hanya memberikan prompt, atau format berbeda, kita gunakan placeholder
            print("Model Image tidak mengembalikan data gambar mentah. Mengirim tanpa gambar.")
            image_file_path = None
    except Exception as e:
        print(f"Gagal membuat gambar AI: {e}")
        image_file_path = None

    # --- 2. KIRIM DATA KE API ---
    payload = {
        "title": data['title'],
        "content": data['content'],
        "is_pinned": False
    }
    
    files = {}
    if image_file_path:
        files['image'] = open(image_file_path, 'rb')

    try:
        response = requests.post(f"{BASE_URL}/api/news/", data=payload, files=files, headers=headers)
        if image_file_path: files['image'].close()
        return response.status_code == 200
    except Exception as e:
        print(f"Error saat posting: {e}")
        return False

if __name__ == "__main__":
    token = get_token()
    if not token:
        print("Gagal mendapatkan token. Pastikan .env sudah benar dan backend menyala.")
    else:
        news = fetch_latest_news()
        if news:
            ai_data = process_with_gemini(news)
            if ai_data:
                success = post_to_website(token, ai_data)
                if success:
                    print(f"Berita '{ai_data['title']}' berhasil diterbitkan dengan gambar AI!")
                else:
                    print("Gagal memposting berita.")
