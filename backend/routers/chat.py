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
    # Fetch Knowledge Base from File (Static Info from Website)
    kb_content = ""
    kb_path = os.path.join(os.path.dirname(__file__), "..", "knowledge_base.txt")
    if os.path.exists(kb_path):
        try:
            with open(kb_path, "r", encoding="utf-8") as f:
                kb_content = f.read()
                print(f"📖 [INFO] Knowledge Base loaded ({len(kb_content)} chars)")
        except Exception as e:
            print(f"⚠️ Failed to read knowledge_base.txt: {e}")

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
Di bawah ini adalah SATU-SATUNYA sumber kebenaran yang boleh Anda gunakan.
JANGAN gunakan pengetahuan lain di luar dokumen ini.

================================================================
DOKUMEN RESMI: SMK BAKTI NUSANTARA 666
================================================================
{kb_content}

JURUSAN AKTIF (dari database, hanya ini yang tersedia):
{majors_info}

GURU & STAF:
{teachers_info}

KONTAK WHATSAPP RESMI:
{wa_info}
================================================================
SELESAI DOKUMEN
================================================================

Anda adalah "Baknus AI", asisten virtual resmi SMK Bakti Nusantara 666.

ATURAN KERAS - WAJIB DIIKUTI:
1. HANYA gunakan informasi dari DOKUMEN RESMI di atas.
2. DILARANG KERAS menggunakan pengetahuan sendiri di luar dokumen.
3. Jika tidak ada di dokumen, jawab: "Untuk informasi ini silakan hubungi sekolah langsung."

CONTOH JAWABAN WAJIB (ikuti persis):
- Tanya: "Kapan sekolah ini berdiri?"
  Jawab: "SMK Bakti Nusantara 666 berdiri sejak tahun 2007, di bawah naungan Yayasan Pendidikan Dasar dan Menengah Bakti Nusantara 666."
- Tanya: "Di mana alamatnya?"
  Jawab: "SMK Bakti Nusantara 666 berlokasi di Jl. Percobaan Km.17 No.65, Cimekar, Cileunyi, Bandung Timur, Jawa Barat."
- Tanya: "Apa saja jurusannya?"
  Jawab: Sebutkan HANYA daftar jurusan dari DOKUMEN di atas.

Gunakan Bahasa Indonesia yang santun dan profesional.
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
                    "stream": False,
                    "keep_alive": "24h" # Keep model in RAM for 24 hours
                },
                timeout=300 # Increased to 5 mins for slow CPU loading
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
