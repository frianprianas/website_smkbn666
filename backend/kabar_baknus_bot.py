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

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API")
client = MistralClient(api_key=MISTRAL_API_KEY)

def fetch_external_news():
    query = quote('SMK Bakti Nusantara 666 OR "SMK Baknus 666" OR "SMK BN 666"')
    rss_url = f"https://news.google.com/rss/search?q={query}&hl=id&gl=ID&ceid=ID:id"
    
    feed = feedparser.parse(rss_url)
    return feed.entries[:5] # Ambil 5 berita terbaru di internet

def summarize_with_mistral(title, description):
    if not MISTRAL_API_KEY:
        return description[:200] + "..."
    
    prompt = f"Rangkum berita berikut menjadi 1 paragraf singkat dan menarik untuk website sekolah:\nJudul: {title}\nKonten: {description}"
    
    try:
        messages = [ChatMessage(role="user", content=prompt)]
        chat_response = client.chat(
            model="mistral-tiny",
            messages=messages,
        )
        return chat_response.choices[0].message.content
    except Exception as e:
        print(f"Mistral Error: {e}")
        return description[:200] + "..."

def run_bot():
    db = SessionLocal()
    # Cek apakah konten sudah ada
    count = db.query(models.KabarBaknus).count()
    if count > 0:
        print("⏭️ Kabar Baknus sudah terisi, melewati proses...")
        db.close()
        return

    print("🔍 Mencari kabar Baknus di internet...")
    entries = fetch_external_news()
    
    for entry in entries:
        title = entry.title
        link = entry.link
        # Google News RSS usually doesn't give full image easily, 
        # we'll use a default icon or placeholder for now
        summary = summarize_with_mistral(title, entry.summary)
        
        kabar = models.KabarBaknus(
            title=title,
            summary=summary,
            source_link=link,
            source_name=entry.source.get('title', 'Berita Internet'),
            image_url=None # Bisa ditambahkan logic scraping image jika perlu
        )
        db.add(kabar)
        print(f"✅ Tersimpan: {title[:50]}...")
    
    db.commit()
    db.close()
    print("🚀 Selesai mengumpulkan Kabar Baknus!")

if __name__ == "__main__":
    run_bot()
