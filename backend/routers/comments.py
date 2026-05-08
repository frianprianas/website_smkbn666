import os
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import schemas, database, models, auth

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# Gunakan gemini-pro yang lebih stabil di berbagai versi library
model = genai.GenerativeModel('gemini-pro')

router = APIRouter(
    prefix="/comments",
    tags=["comments"],
)

async def scan_with_baknus_ai(text: str):
    prompt = f"""
    SEBAGAI MODERATOR AI SMK BAKTI NUSANTARA 666.
    TUGAS: SCAN KOMENTAR DARI KATA KASAR/TIDAK SOPAN (INDO, INGGRIS, SUNDA, JAWA).
    
    TEKS KOMENTAR: "{text}"
    
    ATURAN:
    - JIKA ADA KATA KASAR, HINAAN, ATAU TIDAK SOPAN, JAWAB: KASAR
    - JIKA SOPAN, JAWAB: AMAN
    
    JAWAB DENGAN SATU KATA SAJA!
    """
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("❌ ERROR: GEMINI_API_KEY tidak ditemukan!")
            return False

        response = await model.generate_content_async(prompt)
        # Tambahkan pengecekan jika response kosong atau diblokir safety filter
        if not response.text:
            return False
            
        result = response.text.strip().upper()
        print(f"🔍 BaknusAI Scan: [{text}] -> Result: {result}")
        
        return "KASAR" in result or "TIDAK" in result
    except Exception as e:
        print(f"⚠️ BaknusAI System Error: {e}")
        # Jika error karena model/limit, biarkan aman, tapi jika error karena kata-kata kasar yang diblokir API, anggap kasar
        if "safety" in str(e).lower():
            return True
        return False

@router.post("/", response_model=schemas.Comment)
async def create_comment(
    comment: schemas.CommentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 1. AI Scan (BaknusAI)
    is_rude = await scan_with_baknus_ai(comment.content)
    if is_rude:
        raise HTTPException(
            status_code=400, 
            detail="BaknusAI mendeteksi kata-kata yang kurang sopan. Mohon gunakan bahasa yang lebih santun."
        )

    # 2. Check if news exists
    news_item = db.query(models.News).filter(models.News.id == comment.news_id).first()
    if not news_item:
        raise HTTPException(status_code=404, detail="News not found")
    
    new_comment = models.Comment(
        content=comment.content,
        news_id=comment.news_id,
        user_id=current_user.id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.get("/news/{news_id}", response_model=List[schemas.Comment])
def get_comments(
    news_id: int, 
    skip: int = 0, 
    limit: int = 25, 
    db: Session = Depends(database.get_db)
):
    comments = db.query(models.Comment)\
        .filter(models.Comment.news_id == news_id)\
        .order_by(models.Comment.date_posted.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return comments

@router.put("/{comment_id}", response_model=schemas.Comment)
async def update_comment(
    comment_id: int,
    comment_update: schemas.CommentBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Only owner can edit
    if db_comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
    
    # AI Scan again for the update
    is_rude = await scan_with_baknus_ai(comment_update.content)
    if is_rude:
        raise HTTPException(status_code=400, detail="BaknusAI: Update ditolak karena mengandung kata tidak sopan.")

    db_comment.content = comment_update.content
    db.commit()
    db.refresh(db_comment)
    return db_comment

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Only author or admin can delete
    if current_user.role != "admin" and comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    db.delete(comment)
    db.commit()
    return None
