from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import database, models
import os
import google.generativeai as genai
from typing import List, Optional
from datetime import datetime

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
)

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def get_school_context(db: Session):
    # Fetch Majors
    majors = db.query(models.Major).all()
    majors_info = "\n".join([f"- {m.name}: {m.description}" for m in majors])
    
    # Fetch Recent News
    news = db.query(models.News).order_by(models.News.date_posted.desc()).limit(5).all()
    news_info = "\n".join([f"- {n.title} ({n.date_posted.strftime('%d %b %Y')})" for n in news])
    
    # Fetch Agendas
    agendas = db.query(models.Agenda).order_by(models.Agenda.date.desc()).limit(3).all()
    agenda_info = "\n".join([f"- {a.title} di {a.location} pada {a.date}" for a in agendas])

    context = f"""
Anda adalah Baknus AI, asisten virtual resmi SMK Bakti Nusantara 666.
Tugas Anda adalah memberikan informasi yang akurat tentang sekolah berdasarkan data berikut:

PROGRAM KEAHLIAN (JURUSAN):
{majors_info}

BERITA TERBARU:
{news_info}

AGENDA MENDATANG:
{agenda_info}

INFORMASI SPMB (PENDAFTARAN):
- Website Pendaftaran: https://spmb.smkbn666.sch.id
- Lokasi: Jl. Percobaan No.65, Cileunyi, Bandung.
- Visi: Mewujudkan generasi kompeten, berkarakter Santun, Jujur, Taat.
- Keunggulan: Sekolah berbasis industri kreatif, gedung modern, fasilitas lengkap.

ATURAN JAWABAN:
1. Jawablah dengan ramah, santun, dan profesional (Gunakan Bahasa Indonesia yang baik).
2. Jika ditanya soal pendaftaran, arahkan ke https://spmb.smkbn666.sch.id.
3. Batasi jawaban Anda agar ringkas dan padat.
4. Jika ditanya di luar konteks sekolah, jawablah bahwa Anda hanya bisa membantu seputar informasi SMK Bakti Nusantara 666.
"""
    return context

@router.post("/ask")
async def ask_baknus_ai(request: ChatRequest, db: Session = Depends(database.get_db)):
    if not GEMINI_API_KEY:
        return {"reply": "Maaf, fitur AI sedang tidak tersedia (API Key belum dikonfigurasi)."}

    try:
        context = get_school_context(db)
        
        # Using Gemini 1.5 Flash for speed and efficiency
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prepare the prompt with history
        full_prompt = context + "\n\nPercakapan sebelumnya:\n"
        for msg in request.history[-4:]: # Only last 4 messages for context
            role = "User" if msg['role'] == 'user' else "Baknus AI"
            full_prompt += f"{role}: {msg['content']}\n"
        
        full_prompt += f"User: {request.message}\nBaknus AI:"

        response = model.generate_content(full_prompt)
        
        return {
            "reply": response.text,
            "status": "success"
        }
    except Exception as e:
        print(f"Chatbot Error: {e}")
        return {"reply": "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.", "error": str(e)}
