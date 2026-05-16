from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import database, models
import os
import google.generativeai as genai
import requests
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

# Ollama Configuration
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b")

if ACTIVE_GEMINI_KEYS:
    genai.configure(api_key=ACTIVE_GEMINI_KEYS[0])

def get_school_context(db: Session):
    # Fetch Majors
    majors = db.query(models.Major).all()
    print(f"🔍 [DEBUG] Database returned {len(majors)} majors.")
    for m in majors:
        print(f"   - Found Major: {m.name}")
        
    majors_info = "\n".join([f"- {m.name}: {m.description}" for m in majors])
    
    if not majors:
        print("⚠️ [WARNING] No majors found in database! AI will likely hallucinate.")
        majors_info = "Data jurusan belum tersedia di database."
    
    # Fetch Recent News
    news = db.query(models.News).order_by(models.News.date_posted.desc()).limit(5).all()
    news_info = "\n".join([f"- {n.title} ({n.date_posted.strftime('%d %b %Y')})" for n in news])
    
    # Fetch Agendas
    agendas = db.query(models.Agenda).order_by(models.Agenda.date.desc()).limit(3).all()
    agenda_info = "\n".join([f"- {a.title} di {a.location} pada {a.date}" for a in agendas])

    # Fetch Teachers & Staff
    teachers = db.query(models.Teacher).limit(10).all()
    teachers_info = "\n".join([f"- {t.name} ({t.position})" for t in teachers])
    
    # Fetch Partners (DUDI)
    partners = db.query(models.Partner).all()
    partners_info = ", ".join([p.name for p in partners])

    # Fetch Official WA Numbers
    wa_numbers = db.query(models.WANumber).filter(models.WANumber.is_active == True).all()
    wa_info = "\n".join([f"- {w.name}: https://wa.me/{w.phone_number}" for w in wa_numbers])

    context = f"""
SISTEM: Anda adalah "Baknus AI".
PENTING: HAPUS SEMUA pengetahuan umum Anda tentang SMK lain. 
HANYA berikan jawaban berdasarkan data di bawah ini. JANGAN MENAMBAH JURUSAN SENDIRI.

--- DATA RESMI SMK BAKTI NUSANTARA 666 ---
DAFTAR JURUSAN RESMI (HANYA INI YANG ADA):
{majors_info}

GURU & STAF:
{teachers_info}

--- ATURAN JAWABAN JURUSAN ---
1. Jika ditanya soal jurusan, LIHAT DAFTAR DI ATAS.
2. JIKA jurusan tidak ada di daftar di atas (seperti TKJ, Multimedia, RPL, atau BDP), ANDA WAJIB MENJAWAB: "Jurusan tersebut tidak tersedia di SMK Bakti Nusantara 666. Jurusan yang tersedia saat ini adalah: [Sebutkan daftar di atas]."
3. DILARANG KERAS berasumsi atau menebak jurusan.

--- DATA PENDUKUNG LAIN ---
BERITA: {news_info}
AGENDA: {agenda_info}
KONTAK: {wa_info}
SPMB: https://spmb.smkbn666.sch.id
"""
    return context

@router.post("/ask")
async def ask_baknus_ai(request: ChatRequest, db: Session = Depends(database.get_db)):
    if not ACTIVE_GEMINI_KEYS and not MISTRAL_API_KEY and AI_PROVIDER != "ollama":
        return {"reply": "Maaf, fitur AI sedang tidak tersedia (API Key atau Provider belum dikonfigurasi)."}

    last_error = None
    context = get_school_context(db)

    # 1. TRY OLLAMA (If selected as primary)
    if AI_PROVIDER == "ollama":
        try:
            print(f"🦙 Calling Ollama ({OLLAMA_MODEL}) at {OLLAMA_BASE_URL}...")
            
            ollama_messages = [
                {"role": "system", "content": context},
            ]
            for msg in request.history[-4:]:
                ollama_messages.append({"role": msg['role'], "content": msg['content']})
            ollama_messages.append({"role": "user", "content": request.message})

            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": ollama_messages,
                    "stream": False
                },
                timeout=180 # Increased for CPU-only servers
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "reply": result['message']['content'],
                    "status": "success",
                    "used_engine": f"ollama-{OLLAMA_MODEL}"
                }
            else:
                last_error = f"Ollama error: {response.text}"
                print(f"⚠️ Ollama returned {response.status_code}. Falling back to Cloud AI...")
        except Exception as ollama_err:
            last_error = str(ollama_err)
            print(f"⚠️ Ollama failed: {ollama_err}. Falling back to Cloud AI...")

    # 2. TRY GEMINI KEYS (Fallback or Primary)
    for api_key in ACTIVE_GEMINI_KEYS:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            full_prompt = context + "\n\nPercakapan sebelumnya:\n"
            for msg in request.history[-4:]: 
                role = "User" if msg['role'] == 'user' else "Baknus AI"
                full_prompt += f"{role}: {msg['content']}\n"
            
            full_prompt += f"User: {request.message}\nBaknus AI:"
            response = model.generate_content(full_prompt)
            
            return {
                "reply": response.text,
                "status": "success",
                "used_engine": f"gemini-key-{ACTIVE_GEMINI_KEYS.index(api_key)+1}"
            }
        except Exception as e:
            last_error = str(e)
            print(f"⚠️ Gemini Key {ACTIVE_GEMINI_KEYS.index(api_key)+1} failed: {e}")
            continue 

    # 3. FINAL FALLBACK TO MISTRAL AI (Using Direct Web Request)
    if MISTRAL_API_KEY:
        try:
            print("🚀 Switching to Mistral AI Fallback (Web Request)...")
            
            mistral_messages = [
                {"role": "system", "content": context},
            ]
            for msg in request.history[-4:]:
                mistral_messages.append({"role": msg['role'], "content": msg['content']})
            mistral_messages.append({"role": "user", "content": request.message})

            response = requests.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": f"Bearer {MISTRAL_API_KEY}"
                },
                json={
                    "model": "mistral-large-latest",
                    "messages": mistral_messages
                },
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "reply": result['choices'][0]['message']['content'],
                    "status": "success",
                    "used_engine": "mistral-api"
                }
            else:
                last_error = f"Mistral API error: {response.text}"
                print(f"❌ Mistral API returned {response.status_code}: {response.text}")
        except Exception as mistral_err:
            print(f"❌ Mistral Fallback also failed: {mistral_err}")
            last_error = str(mistral_err)

    # If everything failed
    import traceback
    error_msg = traceback.format_exc()
    print(f"❌ All AI Engines Failed. Last error: {error_msg}")
    return {"reply": "Maaf, semua sistem AI kami sedang mencapai batas kuota. Silakan hubungi admin atau coba beberapa saat lagi.", "error": last_error}
