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

# Ambil semua API Key yang tersedia
API_KEYS = [os.getenv("GEMINI_API_KEY"), os.getenv("GEMINI_API_KEY2"), os.getenv("GEMINI_API_KEY3")]
API_KEYS = [k for k in API_KEYS if k]
MISTRAL_API_KEY = os.getenv("MISTRAL_API")

current_key_index = 0

async def check_comment_with_ai(content: str):
    """Fungsi moderasi komentar menggunakan Gemini dengan cadangan Mistral"""
    global current_key_index
    prompt = f"Apakah komentar ini mengandung kata kasar, SARA, atau spam? Jawab hanya 'AMAN' atau 'TIDAK AMAN'. Komentar: {content}"

    # Tahap 1: Coba Gemini
    for _ in range(len(API_KEYS)):
        try:
            key = API_KEYS[current_key_index]
            genai.configure(api_key=key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = await model.generate_content_async(prompt)
            result = response.text.strip().upper()
            if "AMAN" in result and "TIDAK AMAN" not in result: return True
            if "TIDAK AMAN" in result: return False
        except:
            current_key_index = (current_key_index + 1) % len(API_KEYS)
            continue

    # Tahap 2: Coba Mistral jika Gemini semua gagal
    if MISTRAL_API_KEY:
        try:
            client = MistralClient(api_key=MISTRAL_API_KEY)
            res = client.chat(model="mistral-tiny", messages=[ChatMessage(role="user", content=prompt)])
            result = res.choices[0].message.content.strip().upper()
            if "AMAN" in result and "TIDAK AMAN" not in result: return True
        except: pass

    return True # Default lulus jika AI semua error agar tidak menghambat user

@router.post("/", response_model=schemas.Comment)
async def create_comment(
    comment: schemas.CommentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # 1. Penyaringan AI
    is_safe = await check_comment_with_ai(comment.content)
    if not is_safe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Komentar Anda terdeteksi mengandung konten yang tidak pantas."
        )

    # 2. Simpan ke Database
    new_comment = models.Comment(
        content=comment.content,
        news_id=comment.news_id,
        user_id=current_user.id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Hanya admin atau pemilik komentar yang bisa menghapus
    if current_user.role != "admin" and comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}
