from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import database, models
import os
import google.generativeai as genai
from mistralai import Mistral
from typing import List, Optional
from datetime import datetime

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
)

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []

# Configure Gemini with Multi-Key Support
GEMINI_KEYS = [
    os.getenv("GEMINI_API_KEY", ""),
    os.getenv("GEMINI_API_KEY2", ""),
    os.getenv("GEMINI_API_KEY3", "")
]
# Filter out empty keys
ACTIVE_GEMINI_KEYS = [k for k in GEMINI_KEYS if k]

# Mistral Key
MISTRAL_API_KEY = os.getenv("MISTRAL_API", os.getenv("MISTRAL_API_KEY", ""))

if ACTIVE_GEMINI_KEYS:
    genai.configure(api_key=ACTIVE_GEMINI_KEYS[0])

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
    if not ACTIVE_GEMINI_KEYS:
        return {"reply": "Maaf, fitur AI sedang tidak tersedia (API Key belum dikonfigurasi)."}

    last_error = None
    # Try each active key if the previous one fails
    for api_key in ACTIVE_GEMINI_KEYS:
        try:
            genai.configure(api_key=api_key)
            context = get_school_context(db)
            
            # Using Gemini 2.0 Flash
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            # Prepare the prompt with history
            full_prompt = context + "\n\nPercakapan sebelumnya:\n"
            for msg in request.history[-4:]: 
                role = "User" if msg['role'] == 'user' else "Baknus AI"
                full_prompt += f"{role}: {msg['content']}\n"
            
            full_prompt += f"User: {request.message}\nBaknus AI:"

            response = model.generate_content(full_prompt)
            
            return {
                "reply": response.text,
                "status": "success",
                "used_key_index": ACTIVE_GEMINI_KEYS.index(api_key)
            }
        except Exception as e:
            last_error = str(e)
            print(f"⚠️ API Key {ACTIVE_GEMINI_KEYS.index(api_key)+1} failed: {e}")
            continue # Try next key
            
    # --- FINAL FALLBACK TO MISTRAL AI ---
    if MISTRAL_API_KEY:
        try:
            print("🚀 Switching to Mistral AI Fallback...")
            client = Mistral(api_key=MISTRAL_API_KEY)
            
            # Prepare messages for Mistral
            mistral_messages = [
                {"role": "system", "content": context},
            ]
            for msg in request.history[-4:]:
                mistral_messages.append({"role": msg['role'], "content": msg['content']})
            mistral_messages.append({"role": "user", "content": request.message})

            chat_response = client.chat.complete(
                model="mistral-large-latest",
                messages=mistral_messages,
            )
            
            return {
                "reply": chat_response.choices[0].message.content,
                "status": "success",
                "used_engine": "mistral"
            }
        except Exception as mistral_err:
            print(f"❌ Mistral Fallback also failed: {mistral_err}")
            last_error = str(mistral_err)

    # If everything failed
    import traceback
    error_msg = traceback.format_exc()
    print(f"❌ All AI Engines Failed. Last error: {error_msg}")
    return {"reply": "Maaf, semua sistem AI kami sedang mencapai batas kuota. Silakan hubungi admin atau coba beberapa saat lagi.", "error": last_error}
