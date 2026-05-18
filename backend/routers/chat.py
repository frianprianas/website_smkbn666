from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import database, models
import os
import json
import queue
import threading
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
    # Fetch Knowledge Base from File
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

    # Fetch Official WA Numbers
    wa_numbers = db.query(models.WANumber).filter(models.WANumber.is_active == True).all()
    wa_info = "\n".join([f"- {w.name}: https://wa.me/{w.phone_number}" for w in wa_numbers])

    context = f"""Di bawah ini adalah SATU-SATUNYA sumber kebenaran yang boleh Anda gunakan.
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
  Jawab: "SMK Bakti Nusantara 666 berdiri sejak tahun 2007."
- Tanya: "Di mana alamatnya?"
  Jawab: "SMK Bakti Nusantara 666 berlokasi di Jl. Percobaan Km.17 No.65, Cimekar, Cileunyi, Bandung Timur, Jawa Barat."
- Tanya: "Apa saja jurusannya?"
  Jawab: Sebutkan HANYA daftar jurusan dari DOKUMEN di atas.

Gunakan Bahasa Indonesia yang santun dan profesional.
"""
    return context


@router.post("/ask")
async def ask_baknus_ai(request: ChatRequest, db: Session = Depends(database.get_db)):
    context = get_school_context(db)
    msg_history = list(request.history)
    user_message = request.message

    # ── Worker threads ─────────────────────────────────────────────────────────

    def run_ollama(token_queue: queue.Queue):
        """Call Ollama with streaming=True and push tokens into the queue."""
        try:
            print(f"🦙 [Thread] Calling Ollama ({OLLAMA_MODEL})...")
            messages = [{"role": "system", "content": context}]
            for msg in msg_history[-4:]:
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": user_message})

            resp = requests.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": True,
                    "keep_alive": "24h",
                },
                stream=True,
                timeout=300,
            )

            if resp.status_code == 200:
                for line in resp.iter_lines():
                    if line:
                        data = json.loads(line.decode("utf-8"))
                        content = data.get("message", {}).get("content", "")
                        if content:
                            token_queue.put(("token", content))
                token_queue.put(("done", None))
            else:
                token_queue.put(("error", f"Ollama HTTP {resp.status_code}"))
        except Exception as exc:
            print(f"⚠️ Ollama thread error: {exc}")
            token_queue.put(("error", str(exc)))

    def run_gemini(token_queue: queue.Queue):
        """Fallback: call Gemini streaming in a thread."""
        for api_key in ACTIVE_GEMINI_KEYS:
            try:
                print("🚀 [Thread] Calling Gemini fallback...")
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-2.0-flash")

                full_prompt = context + "\n\nPercakapan sebelumnya:\n"
                for msg in msg_history[-4:]:
                    role = "User" if msg["role"] == "user" else "Baknus AI"
                    full_prompt += f"{role}: {msg['content']}\n"
                full_prompt += f"User: {user_message}\nBaknus AI:"

                resp = model.generate_content(full_prompt, stream=True)
                for chunk in resp:
                    if chunk.text:
                        token_queue.put(("token", chunk.text))
                token_queue.put(("done", None))
                return
            except Exception as exc:
                print(f"⚠️ Gemini key failed: {exc}")
                continue
        token_queue.put(("error", "Semua Gemini key gagal"))

    def run_mistral(token_queue: queue.Queue):
        """Last-resort fallback: Mistral streaming."""
        try:
            print("🚀 [Thread] Calling Mistral fallback...")
            messages = [{"role": "system", "content": context}]
            for msg in msg_history[-4:]:
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": user_message})

            resp = requests.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {MISTRAL_API_KEY}",
                },
                json={"model": "mistral-large-latest", "messages": messages, "stream": True},
                stream=True,
                timeout=30,
            )
            if resp.status_code == 200:
                for line in resp.iter_lines():
                    if line:
                        ls = line.decode("utf-8").strip()
                        if ls.startswith("data:") and "[DONE]" not in ls:
                            try:
                                d = json.loads(ls[5:].strip())
                                content = d["choices"][0]["delta"].get("content", "")
                                if content:
                                    token_queue.put(("token", content))
                            except Exception:
                                pass
                token_queue.put(("done", None))
            else:
                token_queue.put(("error", f"Mistral HTTP {resp.status_code}"))
        except Exception as exc:
            print(f"⚠️ Mistral thread error: {exc}")
            token_queue.put(("error", str(exc)))

    # ── Main SSE generator with heartbeat ──────────────────────────────────────

    def generate_stream():
        """
        Heartbeat-based SSE generator.

        • Starts the AI worker in a background thread.
        • Every 3 s with no token, sends an SSE comment (': ping') to keep
          the Nginx connection alive while the model is loading/thinking.
        • On Ollama failure, automatically spawns a Gemini thread, then Mistral.
        """
        token_queue: queue.Queue = queue.Queue()
        fallback_stage = [0]   # 0=ollama, 1=gemini, 2=mistral, 3=give up

        def start_next_engine():
            stage = fallback_stage[0]
            if stage == 0 and AI_PROVIDER == "ollama":
                t = threading.Thread(target=run_ollama, args=(token_queue,), daemon=True)
                t.start()
            elif stage <= 1 and ACTIVE_GEMINI_KEYS:
                fallback_stage[0] = 1
                t = threading.Thread(target=run_gemini, args=(token_queue,), daemon=True)
                t.start()
            elif stage <= 2 and MISTRAL_API_KEY:
                fallback_stage[0] = 2
                t = threading.Thread(target=run_mistral, args=(token_queue,), daemon=True)
                t.start()
            else:
                token_queue.put(("fatal", None))

        start_next_engine()

        while True:
            try:
                event_type, data = token_queue.get(timeout=3)

                if event_type == "token":
                    yield f"data: {json.dumps({'token': data})}\n\n"

                elif event_type == "done":
                    yield f"data: {json.dumps({'done': True})}\n\n"
                    return

                elif event_type in ("error", "fatal"):
                    print(f"⚠️ Engine error at stage {fallback_stage[0]}: {data}")
                    fallback_stage[0] += 1
                    if fallback_stage[0] > 2:
                        yield f"data: {json.dumps({'error': 'Maaf, semua sistem AI sedang sibuk. Silakan coba beberapa saat lagi.'})}\n\n"
                        return
                    start_next_engine()

            except queue.Empty:
                # ⬇ Send SSE heartbeat comment — invisible to user, keeps Nginx alive
                yield ": ping\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "X-Accel-Buffering": "no",   # ← KUNCI: matikan Nginx buffering
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
