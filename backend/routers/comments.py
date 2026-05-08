from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import database, models, schemas, auth
import google.generativeai as genai
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
import os
import random
import time

router = APIRouter(
    prefix="/comments",
    tags=["comments"],
)

API_KEYS = [os.getenv("GEMINI_API_KEY"), os.getenv("GEMINI_API_KEY2"), os.getenv("GEMINI_API_KEY3")]
API_KEYS = [k for k in API_KEYS if k]
MISTRAL_API_KEY = os.getenv("MISTRAL_API")

current_key_index = 0

async def check_comment_with_ai(content: str):
    global current_key_index
    # Instruksi lebih ketat agar AI tidak curhat
    prompt = f"Moderasi teks ini. Jika kasar/SARA/spam jawab 'BLOKIR'. Jika aman jawab 'LOLOS'. Jawab 1 kata saja.\nTeks: {content}"

    print(f"🕵️ Moderasi: '{content[:30]}...'")

    # 1. Coba Gemini
    for _ in range(len(API_KEYS)):
        try:
            genai.configure(api_key=API_KEYS[current_key_index])
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = await model.generate_content_async(prompt)
            result = response.text.strip().upper()
            
            print(f"🤖 AI Gemini (Key {current_key_index+1}) => {result}")
            
            if "BLOKIR" in result: return False
            if "LOLOS" in result: return True
        except Exception as e:
            print(f"⚠️ Gemini Fail: {e}")
            current_key_index = (current_key_index + 1) % len(API_KEYS)
            continue

    # 2. Coba Mistral
    if MISTRAL_API_KEY:
        try:
            client = MistralClient(api_key=MISTRAL_API_KEY)
            res = client.chat(model="mistral-tiny", messages=[ChatMessage(role="user", content=prompt)])
            result = res.choices[0].message.content.strip().upper()
            print(f"🌀 AI Mistral => {result}")
            if "BLOKIR" in result: return False
            return True
        except: pass

    return True

@router.post("/", response_model=schemas.Comment)
async def create_comment(
    comment: schemas.CommentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    print(f"📥 Request Komentar Baru: NewsID={comment.news_id}, User={current_user.username}")
    
    # 1. Moderasi
    is_safe = await check_comment_with_ai(comment.content)
    if not is_safe:
        print("🚫 AI Memblokir Komentar Ini.")
        raise HTTPException(status_code=400, detail="Komentar mengandung konten negatif.")

    # 2. Simpan
    try:
        new_comment = models.Comment(
            content=comment.content,
            news_id=comment.news_id,
            user_id=current_user.id
        )
        db.add(new_comment)
        db.commit()
        db.refresh(new_comment)
        print(f"✅ Berhasil Simpan ID: {new_comment.id}")
        return new_comment
    except Exception as e:
        db.rollback()
        print(f"❌ Gagal Simpan Database: {e}")
        raise HTTPException(status_code=500, detail="Gagal menyimpan ke database.")

@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if current_user.role != "admin" and comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(comment)
    db.commit()
    return {"message": "Success"}
