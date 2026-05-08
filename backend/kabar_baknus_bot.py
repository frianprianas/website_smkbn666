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

def fetch_external_news():
    query = quote('SMK Bakti Nusantara 666 OR "SMK Baknus 666" OR "SMK BN 666"')
    rss_url = f"https://news.google.com/rss/search?q={query}&hl=id&gl=ID&ceid=ID:id"
    
    feed = feedparser.parse(rss_url)
    return feed.entries[:10] # Maksimal 10 berita

def get_image_from_link(url):
    # Logika sederhana untuk mencari gambar dari meta tags (paling efektif untuk berita)
    try:
        response = requests.get(url, timeout=5)
        # Cari meta property="og:image" content="..."
        match = re.search(r'<meta.*?property=["\']og:image["\'].*?content=["\'](.*?)["\']', response.text)
        if match:
            return match.group(1)
    except:
        pass
    return None

def summarize_with_mistral(title, description):
    if not MISTRAL_API_KEY:
        return description[:200] + "..."
    
    prompt = f"Rangkum berita ini dalam 1-2 kalimat pendek dan padat untuk website sekolah:\nJudul: {title}\nKonten: {description}"
    
    try:
        messages = [ChatMessage(role="user", content=prompt)]
        chat_response = client.chat(
            model="mistral-tiny",
            messages=messages,
        )
        return chat_response.choices[0].message.content
    except Exception as e:
        return description[:200] + "..."

def run_bot():
    db = SessionLocal()
    
    print("🧹 Menghapus kabar lama (Overwrite)...")
    db.query(models.KabarBaknus).delete()
    db.commit()

    print("🔍 Mencari kabar Baknus terbaru di internet...")
    entries = fetch_external_news()
    
    for entry in entries:
        title = entry.title
        link = entry.link
        
        print(f"📖 Memproses: {title[:50]}...")
        summary = summarize_with_mistral(title, entry.summary)
        image = get_image_from_link(link)
        
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
    print("🚀 Selesai memperbarui Kabar Baknus! (Maks 10 item)")

if __name__ == "__main__":
    run_bot()
