import os
import requests
import feedparser
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from urllib.parse import quote
from dotenv import load_dotenv
import re

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API")
client = MistralClient(api_key=MISTRAL_API_KEY)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

def get_image_from_link(url):
    try:
        response = requests.get(url, headers=HEADERS, timeout=12, allow_redirects=True)
        html = response.text

        # 1. Cari og:image (Facebook Standard)
        match = re.search(r'<meta.*?property=["\']og:image["\'].*?content=["\'](.*?)["\']', html)
        if not match:
            # 2. Cari twitter:image
            match = re.search(r'<meta.*?name=["\']twitter:image["\'].*?content=["\'](.*?)["\']', html)
        if not match:
            # 3. Cari thumbnail link tag
            match = re.search(r'<link.*?rel=["\']image_src["\'].*?href=["\'](.*?)["\']', html)
        
        if match:
            img_url = match.group(1)
            # Validasi: Pastikan ini URL gambar yang benar & bukan logo google
            if img_url.startswith('http') and "google" not in img_url.lower():
                return img_url
    except Exception as e:
        print(f"⚠️ Gagal scraping gambar: {e}")
    
    # --- FALLBACK: Gunakan gambar sekolah/teknologi yang pasti jalan ---
    fallback_images = [
        "https://images.unsplash.com/photo-1523050853023-8c2d27443ef8?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800"
    ]
    import random
    return random.choice(fallback_images)

def summarize_with_mistral(title, description):
    if not MISTRAL_API_KEY:
        return description[:200] + "..."
    prompt = f"Rangkum berita ini dalam 1 kalimat pendek dan sangat menarik:\nJudul: {title}\nKonten: {description}"
    try:
        messages = [ChatMessage(role="user", content=prompt)]
        chat_response = client.chat(model="mistral-tiny", messages=messages)
        return chat_response.choices[0].message.content
    except:
        return description[:200] + "..."

def run_bot():
    db = SessionLocal()
    print("🧹 Membersihkan data lama...")
    db.query(models.KabarBaknus).delete()
    db.commit()

    query = quote('SMK Bakti Nusantara 666 OR "SMK Baknus 666" OR "SMK BN 666"')
    rss_url = f"https://news.google.com/rss/search?q={query}&hl=id&gl=ID&ceid=ID:id"
    feed = feedparser.parse(rss_url)
    
    print(f"🔍 Menemukan {len(feed.entries)} kabar. Memproses 10 terbaru...")
    for entry in feed.entries[:10]:
        print(f"📖 Memproses: {entry.title[:50]}...")
        image = get_image_from_link(entry.link)
        summary = summarize_with_mistral(entry.title, entry.summary)
        
        kabar = models.KabarBaknus(
            title=entry.title,
            summary=summary,
            source_link=entry.link,
            source_name=entry.source.get('title', 'Berita Internet'),
            image_url=image
        )
        db.add(kabar)
    
    db.commit()
    db.close()
    print("🚀 Kabar Baknus berhasil diperbarui!")

if __name__ == "__main__":
    run_bot()
