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


import re
from collections import Counter

def tokenize_text(text: str) -> List[str]:
    return re.findall(r'\w+', text.lower())

def retrieve_relevant_chunks(query: str, text: str, top_k: int = 3) -> str:
    # Split the document into paragraphs
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if len(p.strip()) > 20]
    if not paragraphs:
        return text
    
    query_lower = query.lower()
    forced_chunks = []
    
    # ── INTENT ROUTING (Typo-tolerant key topic enforcement) ──
    # 1. Tuition Fees / Cost (Handles typo 'biyanya', 'bayar', etc.)
    if any(k in query_lower for k in ["biay", "biy", "bayar", "harga", "spp", "ipp", "dsp", "mpls", "uang", "rupiah", "nominal"]):
        for p in paragraphs:
            if "RINCIAN BIAYA" in p:
                forced_chunks.append(p)
                
    # 2. Registration & SPMB Guidelines
    if any(k in query_lower for k in ["daftar", "spmb", "syarat", "cara", "registrasi", "masuk", "formulir", "online"]):
        for p in paragraphs:
            if "INFORMASI PENDAFTARAN" in p or "SYARAT PENDAFTARAN" in p:
                if p not in forced_chunks:
                    forced_chunks.append(p)
                    
    # 3. Location, Contact, or Map Address
    if any(k in query_lower for k in ["alamat", "lokasi", "cileunyi", "map", "gps", "telepon", "kontak"]):
        for p in paragraphs:
            if "LOKASI & KONTAK" in p:
                if p not in forced_chunks:
                    forced_chunks.append(p)

    # 4. History, Foundation or Year of establishment
    if any(k in query_lower for k in ["sejarah", "diri", "berdiri", "kapan", "tahun", "yayasan", "2007"]):
        for p in paragraphs:
            if "SEJARAH SINGKAT" in p or "IDENTITAS SEKOLAH" in p:
                if p not in forced_chunks:
                    forced_chunks.append(p)

    # ── DYNAMIC KEYWORD SEARCH (BM25 Fallback) ──
    query_tokens = tokenize_text(query)
    query_counter = Counter(query_tokens)
    scored_chunks = []
    
    for p in paragraphs:
        p_tokens = tokenize_text(p)
        p_counter = Counter(p_tokens)
        score = 0
        for token, count in query_counter.items():
            if token in p_counter:
                score += p_counter[token] * count
        scored_chunks.append((score, p))
        
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    
    # Compile final selection
    rag_chunks = []
    for score, p in scored_chunks:
        if p not in forced_chunks:
            rag_chunks.append(p)
            
    final_selection = (forced_chunks + rag_chunks)[:top_k]
    return "\n\n".join(final_selection)

def get_school_context(db: Session, user_query: str = ""):
    # Fetch Knowledge Base from File
    kb_content = ""
    kb_path = os.path.join(os.path.dirname(__file__), "..", "knowledge_base.txt")
    if os.path.exists(kb_path):
        try:
            with open(kb_path, "r", encoding="utf-8") as f:
                raw_kb = f.read()
                # Apply Typo-Tolerant Hybrid RAG
                kb_content = retrieve_relevant_chunks(user_query, raw_kb, top_k=3)
                print(f"📖 [RAG] Retrieved context matching user intent ({len(kb_content)} chars)")
        except Exception as e:
            print(f"⚠️ Failed to read knowledge_base.txt: {e}")

    # Fetch Majors
    majors = db.query(models.Major).all()
    majors_info = "\n".join([f"- {m.name}: {m.description}" for m in majors])
    if not majors:
        majors_info = "Data jurusan belum tersedia."

    # Fetch Official WA Numbers
    wa_numbers = db.query(models.WANumber).filter(models.WANumber.is_active == True).all()
    wa_info = "\n".join([f"- {w.name}: https://wa.me/{w.phone_number}" for w in wa_numbers])

    context = f"""Di bawah ini adalah dokumen resmi sekolah yang boleh Anda gunakan.

================================================================
INFORMASI SEKOLAH RELEVAN:
================================================================
{kb_content}

JURUSAN:
{majors_info}

KONTAK RESMI:
{wa_info}
================================================================

Peran Anda: Anda adalah "Baknus AI", asisten virtual resmi SMK Bakti Nusantara 666.

Aturan Respon Anda:
1. Utamakan menjawab singkat, ramah, dan padat.
2. Jawab pertanyaan seputar profil sekolah HANYA berdasarkan data di atas. Jika data tidak ada di atas, jawab: "Untuk informasi ini silakan hubungi sekolah langsung."
3. PENGECUALIAN UNTUK OBROLAN / CHITCHAT: Anda diizinkan menjawab sapaan hangat (seperti "selamat pagi", "halo"), pertanyaan tentang keadaan Anda, dan pertanyaan seputar identitas diri Anda sebagai AI (misal: "apakah Anda menggunakan Qwen?", "siapa yang membuat Anda?"). Jawablah dengan jujur, cerdas, dan tetap ramah tanpa perlu mengeluarkan kalimat penolakan standar.
"""
    return context


@router.post("/ask")
async def ask_baknus_ai(request: ChatRequest, db: Session = Depends(database.get_db)):
    user_message = request.message
    context = get_school_context(db, user_query=user_message)
    msg_history = list(request.history)

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
                    "options": {
                        "num_ctx": 4096,      # Increased to 4K tokens to fit the knowledge base
                        "num_predict": 512    # Max response length (Prevents CPU overheat)
                    }
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
