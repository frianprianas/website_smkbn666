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

# Header agar tidak diblokir oleh situs berita
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def fetch_external_news():
    query = quote('SMK Bakti Nusantara 666 OR "SMK Baknus 666" OR "SMK BN 666"')
    rss_url = f"https://news.google.com/rss/search?q={query}&hl=id&gl=ID&ceid=ID:id"
    
    feed = feedparser.parse(rss_url)
    return feed.entries[:10]

def get_image_from_link(url):
    try:
        # Ikuti redirect sampai ke URL asli
        response = requests.get(url, headers=HEADERS, timeout=10, allow_redirects=True)
        final_url = response.url
        html = response.text

        # Cari og:image (Facebook) atau twitter:image
        match = re.search(r'<meta.*?property=["\']og:image["\'].*?content=["\'](.*?)["\']', html)
        if not match:
            match = re.search(r'<meta.*?name=["\']twitter:image["\'].*?content=["\'](.*?)["\']', html)
        
        if match:
            img_url = match.group(1)
            # Pastikan bukan logo google
            if "googleusercontent" not in img_url and "google" not in img_url.lower():
                return img_url
    except Exception as e:
        print(f"❌ Gagal ambil gambar dari {url[:30]}... : {e}")
    return None

def summarize_with_mistral(title, description):
    if not MISTRAL_API_KEY:
        return description[:200] + "..."
    
    prompt = f"Rangkum berita ini dalam 1 kalimat pendek dan sangat menarik:\nJudul: {title}\nKonten: {description}"
    
    try:
        messages = [ChatMessage(role="user", content=prompt)]
        chat_response = client.chat(
            model="mistral-tiny",
            messages=messages,
        )
        return chat_response.choices[0].message.content
    except:
        return description[:200] + "..."

def run_bot():
    db = SessionLocal()
    
    print("🧹 Membersihkan data lama...")
    db.query(models.KabarBaknus).delete()
    db.commit()

    print("🔍 Mencari kabar Baknus di internet...")
    entries = fetch_external_news()
    
    for entry in entries:
        title = entry.title
        link = entry.link
        
        print(f"📖 Memproses: {title[:50]}...")
        image = get_image_from_link(link)
        summary = summarize_with_mistral(title, entry.summary)
        
        kabar = models.KabarBaknus(
            title=title,
            summary=summary,
            source_link=link,
            source_name=entry.source.get('title', 'Berita Internet'),
            image_url=image
        )
        db.add(kabar)
    
    db.commit()
    db.close()
    print("🚀 Kabar Baknus berhasil diperbarui dengan gambar asli!")

if __name__ == "__main__":
    run_bot()
